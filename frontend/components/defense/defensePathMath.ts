/**
 * 보드 셸(outerW × outerH) 좌표계, 경로 두께 P.
 * 반시계 방향, 왼쪽 위 (P/2, P/2)에서 t=0.
 */
export function pointOnLoopCCWFromTopLeft(
  t: number,
  W: number,
  H: number,
  P: number
): { x: number; y: number } {
  const Lb = W - P;
  const Lr = H - P;
  const Lt = W - P;
  const Ll = H - P;
  const perimeter = Lb + Lr + Lt + Ll;
  let u = t * perimeter;
  u -= Math.floor(u / perimeter) * perimeter;

  if (u < Ll) {
    return { x: P / 2, y: P / 2 + u };
  }
  u -= Ll;
  if (u < Lb) {
    return { x: P / 2 + u, y: H - P / 2 };
  }
  u -= Lb;
  if (u < Lr) {
    return { x: W - P / 2, y: H - P / 2 - u };
  }
  u -= Lr;
  return { x: W - P / 2 - u, y: P / 2 };
}
