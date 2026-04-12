import {
  View,
  StyleSheet,
  Image,
  LayoutChangeEvent,
  Pressable,
  Text,
} from "react-native";
import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PlacedTowerData } from "./defenseTypes";
import { DEFENSE_GRID_COLS, DEFENSE_GRID_ROWS } from "./defenseGrid";
import { pointOnLoopCCWFromTopLeft } from "./defensePathMath";
import {
  DEFENSE_ENEMY_MAX_HP,
  DEFENSE_PROJECTILE_FLIGHT_MS,
  DEFENSE_PROJECTILE_SIZE,
  getDefenseTowerCombat,
} from "./defenseCombatConstants";

const CELL_GAP = 6;

/** 한 바퀴 주기(ms). 기존 18000 대비 약 1.3배 빠름 */
const ENEMY_LAP_DURATION_MS = Math.round(18000 / 1.3);

/** 라운드 시작 후 첫 스폰까지 간격 + 이후 스폰 간격 */
const ENEMY_SPAWN_INTERVAL_MS = 1500;

const MONSTER_IMAGE = require("../../assets/images/animation/fox/fox_running/0.png");

type FieldEnemy = {
  id: string;
  hp: number;
  /** 게임오버 등 정지 시 경로 위상(0~1) 스냅 */
  pausedPhase?: number;
};

type Projectile = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  targetId: string;
  startTime: number;
  damage: number;
};

function towerCellCenterPx(
  col: number,
  row: number,
  cellSide: number
): { x: number; y: number } {
  const ox = cellSide;
  const oy = cellSide;
  const x = ox + col * (cellSide + CELL_GAP) + cellSide / 2;
  const y = oy + row * (cellSide + CELL_GAP) + cellSide / 2;
  return { x, y };
}

/** lapAccMs = 1배 기준으로 경로를 따라 누적된 ms; 배속은 ref 갱신 시에만 곱해짐 */
function enemyTravelPhase(
  e: FieldEnemy,
  lapAccMs: number,
  isFrozen: boolean
): number {
  if (isFrozen && e.pausedPhase !== undefined) {
    const ph = e.pausedPhase;
    return ph - Math.floor(ph);
  }
  const m = lapAccMs % ENEMY_LAP_DURATION_MS;
  const norm = (m + ENEMY_LAP_DURATION_MS) % ENEMY_LAP_DURATION_MS;
  return norm / ENEMY_LAP_DURATION_MS;
}

type Props = {
  unitZoneRef?: RefObject<View | null>;
  placedTowers?: PlacedTowerData[];
  onUnitZoneLayout?: () => void;
  isDropTarget?: boolean;
  onCellSideChange?: (side: number) => void;
  onFieldEnemyCountChange?: (count: number) => void;
  isFrozen?: boolean;
  /** false면 적 스폰 타이머 비활성(웨이브 배너·후반 무스폰 구간) */
  spawnEnemiesEnabled?: boolean;
  /** 배치 타워 삭제(선택 UI의 '삭제') */
  onRemovePlacedTower?: (towerId: string) => void;
  /** 배치 타워 '정보' 탭 */
  onPlacedTowerInfoPress?: (tower: PlacedTowerData) => void;
  /** 이번 틱에서 처치된 적 수(투사체 명중으로 사망 처리된 경우만) */
  onEnemiesKilled?: (count: number) => void;
  /** 2면 적 경로 누적·스폰·타워·투사체가 실시간 기준 2배(경로 위치는 1배 기준 누적만 사용) */
  speedMultiplier?: number;
  /** 스폰 시 적 초기 hp (미지정 시 DEFENSE_ENEMY_MAX_HP) */
  enemySpawnMaxHp?: number;
};

function computeCellSideForAvail(availW: number, availH: number): number {
  const COLS = DEFENSE_GRID_COLS;
  const ROWS = DEFENSE_GRID_ROWS;
  const G = CELL_GAP;
  if (availW < 56 || availH < 56) return 18;
  const sW = Math.floor((availW - (COLS - 1) * G) / (COLS + 2));
  const sH = Math.floor((availH - (ROWS - 1) * G) / (ROWS + 2));
  return Math.max(14, Math.min(sW, sH));
}

export default function DefenseBattleFieldPlaceholder({
  unitZoneRef,
  placedTowers = [],
  onUnitZoneLayout,
  isDropTarget = false,
  onCellSideChange,
  onFieldEnemyCountChange,
  isFrozen = false,
  spawnEnemiesEnabled = true,
  onRemovePlacedTower,
  onPlacedTowerInfoPress,
  onEnemiesKilled,
  speedMultiplier = 1,
  enemySpawnMaxHp,
}: Props) {
  const sm = Math.max(1, speedMultiplier);
  const speedMultRef = useRef(sm);
  speedMultRef.current = sm;

  const enemySpawnMaxHpRef = useRef(
    enemySpawnMaxHp ?? DEFENSE_ENEMY_MAX_HP
  );
  enemySpawnMaxHpRef.current = enemySpawnMaxHp ?? DEFENSE_ENEMY_MAX_HP;

  const lapMsByEnemyRef = useRef<Record<string, number>>({});
  const lastEnemySimTickRef = useRef(Date.now());

  const enemySpawnIntervalMs = useMemo(
    () => Math.max(1, Math.round(ENEMY_SPAWN_INTERVAL_MS / sm)),
    [sm],
  );
  const projectileFlightMs = useMemo(
    () => Math.max(1, Math.round(DEFENSE_PROJECTILE_FLIGHT_MS / sm)),
    [sm],
  );
  const [avail, setAvail] = useState({ w: 0, h: 0 });
  const [roundActive] = useState(true);
  const [enemies, setEnemies] = useState<FieldEnemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [, setRenderTick] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{
    col: number;
    row: number;
  } | null>(null);

  const towerLastFireRef = useRef<Record<string, number>>({});
  const prevFrozenRef = useRef(false);
  const enemiesRef = useRef<FieldEnemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const placedTowersRef = useRef<PlacedTowerData[]>([]);
  const projectileIdRef = useRef(0);
  const onEnemiesKilledRef = useRef(onEnemiesKilled);
  onEnemiesKilledRef.current = onEnemiesKilled;

  enemiesRef.current = enemies;
  projectilesRef.current = projectiles;
  placedTowersRef.current = placedTowers;

  const cellSide = useMemo(() => {
    if (avail.w < 56 || avail.h < 56) return 28;
    return computeCellSideForAvail(avail.w, avail.h);
  }, [avail.w, avail.h]);

  const gridBoardW =
    DEFENSE_GRID_COLS * cellSide + (DEFENSE_GRID_COLS - 1) * CELL_GAP;
  const gridBoardH =
    DEFENSE_GRID_ROWS * cellSide + (DEFENSE_GRID_ROWS - 1) * CELL_GAP;

  const outerW = gridBoardW + 2 * cellSide;
  const outerH = gridBoardH + 2 * cellSide;

  const pathP = cellSide;

  useEffect(() => {
    onCellSideChange?.(cellSide);
  }, [cellSide, onCellSideChange]);

  useEffect(() => {
    onFieldEnemyCountChange?.(enemies.length);
  }, [enemies.length, onFieldEnemyCountChange]);

  useEffect(() => {
    setSelectedCell((prev) => {
      if (!prev) return prev;
      const still = placedTowers.some(
        (t) => t.col === prev.col && t.row === prev.row
      );
      return still ? prev : null;
    });
  }, [placedTowers]);

  useLayoutEffect(() => {
    if (isFrozen && !prevFrozenRef.current) {
      setEnemies((prev) =>
        prev.map((e) => {
          const acc = lapMsByEnemyRef.current[e.id] ?? 0;
          return {
            ...e,
            pausedPhase:
              (acc % ENEMY_LAP_DURATION_MS) / ENEMY_LAP_DURATION_MS,
          };
        })
      );
    }
    if (!isFrozen && prevFrozenRef.current) {
      setEnemies((prev) =>
        prev.map((e) => {
          const { pausedPhase: _p, ...rest } = e;
          return rest;
        })
      );
    }
    prevFrozenRef.current = isFrozen;
  }, [isFrozen]);

  useEffect(() => {
    for (const t of placedTowers) {
      if (towerLastFireRef.current[t.id] === undefined) {
        towerLastFireRef.current[t.id] = Date.now();
      }
    }
  }, [placedTowers]);

  useEffect(() => {
    if (!roundActive || isFrozen || !spawnEnemiesEnabled) return;
    const id = setInterval(() => {
      setEnemies((prev) => [
        ...prev,
        {
          id: `enemy-${Date.now()}-${prev.length}`,
          hp: enemySpawnMaxHpRef.current,
        },
      ]);
    }, enemySpawnIntervalMs);
    return () => clearInterval(id);
  }, [roundActive, isFrozen, spawnEnemiesEnabled, enemySpawnIntervalMs]);

  useEffect(() => {
    if (isFrozen) return;

    lastEnemySimTickRef.current = Date.now();

    let frame = 0;
    const tick = () => {
      const now = Date.now();
      const deltaReal = now - lastEnemySimTickRef.current;
      lastEnemySimTickRef.current = now;
      const mult = speedMultRef.current;

      const W = outerW;
      const H = outerH;
      const P = pathP;
      let E = enemiesRef.current;
      for (const en of E) {
        if (en.hp <= 0) continue;
        const id = en.id;
        lapMsByEnemyRef.current[id] =
          (lapMsByEnemyRef.current[id] ?? 0) + deltaReal * mult;
      }
      let Pr = projectilesRef.current;
      let changedE = false;
      let changedP = false;

      const stillFlying: Projectile[] = [];
      let killsThisTick = 0;
      for (const p of Pr) {
        if (now - p.startTime >= projectileFlightMs) {
          const dmg = p.damage;
          const target = E.find((en) => en.id === p.targetId);
          if (target && target.hp > 0) {
            const nextHp = target.hp - dmg;
            if (nextHp <= 0) killsThisTick += 1;
          }
          changedE = true;
          changedP = true;
          E = E.map((en) =>
            en.id === p.targetId ? { ...en, hp: en.hp - dmg } : en
          ).filter((en) => en.hp > 0);
          const aliveIds = new Set(E.map((x) => x.id));
          for (const k of Object.keys(lapMsByEnemyRef.current)) {
            if (!aliveIds.has(k)) delete lapMsByEnemyRef.current[k];
          }
        } else {
          stillFlying.push(p);
        }
      }
      if (killsThisTick > 0) {
        onEnemiesKilledRef.current?.(killsThisTick);
      }
      if (changedP) {
        Pr = stillFlying;
      }

      const alive = E.filter((e) => e.hp > 0);
      const newShots: Projectile[] = [];

      for (const tower of placedTowersRef.current) {
        const combat = getDefenseTowerCombat(tower.unitId);
        const towerAttackIntervalMs = Math.max(
          1,
          Math.round(combat.attackIntervalMs / mult)
        );
        const last = towerLastFireRef.current[tower.id] ?? 0;
        if (now - last < towerAttackIntervalMs) continue;

        const rangeR = combat.rangeRadiusCellMult * cellSide;
        const tc = towerCellCenterPx(tower.col, tower.row, cellSide);
        let best: { id: string; x: number; y: number; d2: number } | null =
          null;

        for (const en of alive) {
          const acc = lapMsByEnemyRef.current[en.id] ?? 0;
          const ph = enemyTravelPhase(en, acc, false);
          const { x: ex, y: ey } = pointOnLoopCCWFromTopLeft(ph, W, H, P);
          const dx = ex - tc.x;
          const dy = ey - tc.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > rangeR * rangeR) continue;
          if (!best || d2 < best.d2) {
            best = { id: en.id, x: ex, y: ey, d2 };
          }
        }

        if (best) {
          towerLastFireRef.current[tower.id] = now;
          projectileIdRef.current += 1;
          newShots.push({
            id: `proj-${projectileIdRef.current}`,
            fromX: tc.x,
            fromY: tc.y,
            toX: best.x,
            toY: best.y,
            targetId: best.id,
            startTime: now,
            damage: combat.damage,
          });
        }
      }

      if (newShots.length > 0) {
        Pr = [...Pr, ...newShots];
        changedP = true;
      }

      if (changedE) {
        enemiesRef.current = E;
        setEnemies(E);
      }
      if (changedP) {
        projectilesRef.current = Pr;
        setProjectiles(Pr);
      }

      setRenderTick((n) => n + 1);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    isFrozen,
    outerW,
    outerH,
    pathP,
    cellSide,
    projectileFlightMs,
  ]);

  const onFieldLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setAvail({ w: width, h: height });
  };

  const monsterPixel = Math.max(40, Math.round(cellSide * 0.62 * 2));
  const monsterHalf = monsterPixel / 2;

  /** 경로–타워 구역 사이 링 두께(기존 대비 약 2/3) */
  const pathTowerSeparator = Math.max(
    3,
    Math.round((cellSide * 0.16 * 2) / 3),
  );

  const towerAt = (col: number, row: number) =>
    placedTowers.find((t) => t.col === col && t.row === row);

  const placedTowerForRange =
    selectedCell != null ? towerAt(selectedCell.col, selectedCell.row) : null;
  const placedRange =
    selectedCell != null && placedTowerForRange != null
      ? (() => {
          const sc = selectedCell;
          const { x, y } = towerCellCenterPx(sc.col, sc.row, cellSide);
          const mult = getDefenseTowerCombat(
            placedTowerForRange.unitId
          ).rangeRadiusCellMult;
          const d = 2 * mult * cellSide;
          const r = d / 2;
          return { cx: x, cy: y, d, r };
        })()
      : null;

  /** `pointOnLoopCCWFromTopLeft` 기준 t=0 — 적이 루프에 진입하는 지점(시각만 살짝 오른쪽·아래) */
  const enemySpawnMarker = useMemo(() => {
    const { x, y } = pointOnLoopCCWFromTopLeft(0, outerW, outerH, pathP);
    const sz = Math.max(24, Math.round(cellSide * 0.55));
    const r = sz / 2;
    const nudge = Math.max(4, Math.min(10, Math.round(cellSide * 0.09)));
    return { cx: x + nudge, cy: y + nudge, sz, r };
  }, [outerW, outerH, pathP, cellSide]);

  const drawNow = Date.now();

  return (
    <View style={styles.field} onLayout={onFieldLayout}>
      <View style={[styles.boardShell, { width: outerW, height: outerH }]}>
        <View
          style={[
            styles.pathRing,
            {
              width: outerW,
              height: outerH,
              padding: cellSide,
            },
          ]}
        >
          <Pressable
            style={styles.pathRingDeselect}
            onPress={() => setSelectedCell(null)}
          />
          <View
            style={[
              styles.towerZoneWrap,
              { width: gridBoardW, height: gridBoardH },
            ]}
          >
            <View
              ref={unitZoneRef}
              style={[
                styles.gridBoard,
                {
                  width: gridBoardW,
                  height: gridBoardH,
                },
                isDropTarget && styles.gridBoardTarget,
              ]}
              onLayout={onUnitZoneLayout}
            >
              {Array.from({ length: DEFENSE_GRID_ROWS }, (_, row) => (
                <View key={row} style={styles.gridRow}>
                  {Array.from({ length: DEFENSE_GRID_COLS }, (_, col) => {
                    const t = towerAt(col, row);
                    const marginRight = col < DEFENSE_GRID_COLS - 1 ? CELL_GAP : 0;
                    const marginBottom = row < DEFENSE_GRID_ROWS - 1 ? CELL_GAP : 0;
                    const isSel =
                      selectedCell?.col === col && selectedCell?.row === row;
                    return (
                      <View
                        key={`${row}-${col}`}
                        style={[
                          styles.cell,
                          {
                            width: cellSide,
                            height: cellSide,
                            marginRight,
                            marginBottom,
                          },
                        ]}
                      >
                        <Pressable
                          style={t ? styles.cellMainTapTower : styles.cellMainTapEmpty}
                          onPress={() => {
                            if (t) {
                              setSelectedCell((prev) =>
                                prev?.col === col && prev?.row === row
                                  ? null
                                  : { col, row }
                              );
                            } else {
                              setSelectedCell(null);
                            }
                          }}
                        >
                          {t ? (
                            <Image
                              source={t.image}
                              style={[
                                styles.towerInCell,
                                isSel && {
                                  width: Math.round(cellSide * 0.55),
                                  height: Math.round(cellSide * 0.4),
                                },
                              ]}
                              resizeMode="contain"
                            />
                          ) : null}
                        </Pressable>
                        {isSel && t ? (
                          <View style={styles.towerActionsRow}>
                            <Pressable
                              style={[styles.towerActionBtn, styles.towerActionBtnInfo]}
                              onPress={() => onPlacedTowerInfoPress?.(t)}
                              hitSlop={10}
                            >
                              <Text style={[styles.towerActionBtnText, styles.towerActionBtnTextInfo]}>
                                정보
                              </Text>
                            </Pressable>
                            <Pressable
                              style={[styles.towerActionBtn, styles.towerActionBtnDelete]}
                              onPress={() => {
                                onRemovePlacedTower?.(t.id);
                                setSelectedCell(null);
                              }}
                              hitSlop={10}
                            >
                              <Text style={[styles.towerActionBtnText, styles.towerActionBtnTextDelete]}>
                                삭제
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.pathTowerDivider,
                {
                  left: -pathTowerSeparator / 2,
                  top: -pathTowerSeparator / 2,
                  width: gridBoardW + pathTowerSeparator,
                  height: gridBoardH + pathTowerSeparator,
                  borderRadius: 12 + pathTowerSeparator / 2,
                  borderWidth: pathTowerSeparator,
                },
              ]}
            />
          </View>
        </View>

        {placedRange ? (
          <View
            style={styles.placedRangeLayer}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View
              style={[
                styles.placedRangeRing,
                {
                  width: placedRange.d,
                  height: placedRange.d,
                  borderRadius: placedRange.r,
                  left: placedRange.cx - placedRange.r,
                  top: placedRange.cy - placedRange.r,
                },
              ]}
            />
          </View>
        ) : null}

        <View style={styles.monsterLayer} pointerEvents="none">
          <View
            style={[
              styles.enemySpawnMarker,
              {
                width: enemySpawnMarker.sz,
                height: enemySpawnMarker.sz,
                borderRadius: enemySpawnMarker.r,
                left: enemySpawnMarker.cx - enemySpawnMarker.r,
                top: enemySpawnMarker.cy - enemySpawnMarker.r,
              },
            ]}
            accessibilityLabel="적 출현 지점"
            accessibilityRole="image"
          />
          {enemies.map((e) => {
            const acc = lapMsByEnemyRef.current[e.id] ?? 0;
            const t = enemyTravelPhase(e, acc, isFrozen);
            const { x, y } = pointOnLoopCCWFromTopLeft(t, outerW, outerH, pathP);
            const m = monsterHalf * 2;
            return (
              <View
                key={e.id}
                style={[
                  styles.monsterWrap,
                  {
                    transform: [
                      { translateX: x - monsterHalf },
                      { translateY: y - monsterHalf },
                    ],
                  },
                ]}
              >
                <Image
                  source={MONSTER_IMAGE}
                  style={{ width: m, height: m }}
                  resizeMode="contain"
                />
              </View>
            );
          })}

          {projectiles.map((p) => {
            const u = Math.min(
              1,
              (drawNow - p.startTime) / projectileFlightMs
            );
            const x = p.fromX + (p.toX - p.fromX) * u;
            const y = p.fromY + (p.toY - p.fromY) * u;
            const half = DEFENSE_PROJECTILE_SIZE / 2;
            return (
              <View
                key={p.id}
                style={[
                  styles.projectile,
                  {
                    width: DEFENSE_PROJECTILE_SIZE,
                    height: DEFENSE_PROJECTILE_SIZE,
                    borderRadius: half,
                    left: x - half,
                    top: y - half,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  boardShell: {
    position: "relative",
    zIndex: 0,
  },
  pathRing: {
    borderRadius: 14,
    backgroundColor: "rgba(200, 200, 200, 0.45)",
    borderWidth: (2 * 2) / 3,
    borderColor: "#C62828",
    overflow: "hidden",
    position: "relative",
  },
  /** 패딩(경로) 영역 탭 시 타워 선택 해제 — 그리드보다 뒤 */
  pathRingDeselect: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  towerZoneWrap: {
    position: "relative",
    zIndex: 1,
  },
  pathTowerDivider: {
    position: "absolute",
    borderColor: "#1B2631",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  gridBoard: {
    borderRadius: 14,
    borderWidth: (2 * 2) / 3,
    borderStyle: "dashed",
    borderColor: "#64B5F6",
    backgroundColor: "rgba(230, 240, 250, 0.5)",
    overflow: "hidden",
  },
  gridBoardTarget: {
    borderColor: "#1E90FF",
    borderStyle: "solid",
    backgroundColor: "rgba(30, 144, 255, 0.18)",
  },
  gridRow: {
    flexDirection: "row",
  },
  cell: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  cellMainTapEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellMainTapTower: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  towerInCell: {
    width: "76%",
    height: "76%",
  },
  towerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
    paddingBottom: 2,
  },
  towerActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  towerActionBtnInfo: {
    backgroundColor: "#FFF9C4",
    borderColor: "rgba(241, 196, 15, 0.55)",
  },
  towerActionBtnDelete: {
    backgroundColor: "#FFCDD2",
    borderColor: "rgba(229, 57, 53, 0.45)",
  },
  towerActionBtnText: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "KotraHope",
  },
  towerActionBtnTextInfo: {
    color: "#5D4E37",
  },
  towerActionBtnTextDelete: {
    color: "#B71C1C",
  },
  /** 배치 타워 선택 시 사거리(전투와 동일: 지름 3×cellSide) — 적·투사체 아래 */
  placedRangeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  placedRangeRing: {
    position: "absolute",
    backgroundColor: "rgba(52, 152, 219, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(41, 128, 185, 0.6)",
  },
  monsterLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  /** 경로상 적 스폰(t=0) 위치 — 적 스프라이트보다 아래에 그려짐 */
  enemySpawnMarker: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(192, 57, 43, 0.9)",
    backgroundColor: "rgba(231, 76, 60, 0.12)",
  },
  monsterWrap: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  projectile: {
    position: "absolute",
    backgroundColor: "#F1C40F",
    borderWidth: 1,
    borderColor: "#D4AC0D",
  },
});
