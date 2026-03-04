import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthManager from "../utils/AuthManager";
import { APP_COLORS } from "../constants/theme";
import * as authApi from "../api/auth";

WebBrowser.maybeCompleteAuthSession();

const LOADING_MESSAGE = "귀여운 동물 친구들이 모이고 있어요!";
const LOAD_PROGRESS_STEPS = [25, 50, 75, 100];

export default function Index() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showFindId, setShowFindId] = useState(false);
  const [showFindPassword, setShowFindPassword] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const registerSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const findIdSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const findPasswordSlideAnim = useRef(new Animated.Value(screenHeight)).current;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  const [findIdName, setFindIdName] = useState("");
  const [findIdResult, setFindIdResult] = useState<string | null>(null);
  const [isFindIdSubmitting, setIsFindIdSubmitting] = useState(false);

  const [findPwEmail, setFindPwEmail] = useState("");
  const [findPwName, setFindPwName] = useState("");
  const [findPwVerified, setFindPwVerified] = useState(false);
  const [findPwNewPassword, setFindPwNewPassword] = useState("");
  const [findPwSuccess, setFindPwSuccess] = useState(false);
  const [isFindPwSubmitting, setIsFindPwSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  });

  useEffect(() => {
    let stepIndex = 0;

    const advanceStep = () => {
      if (stepIndex < LOAD_PROGRESS_STEPS.length) {
        const prog = LOAD_PROGRESS_STEPS[stepIndex];
        setProgress(prog);
        stepIndex++;

        if (prog >= 100) {
          setIsComplete(true);
          return;
        }

        setTimeout(advanceStep, 500);
      }
    };

    const timer = setTimeout(advanceStep, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleTapToLogin = () => {
    if (isComplete && !showLogin && !showRegister && !showFindId && !showFindPassword) {
      setShowLogin(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  };

  const closeLoginPopup = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowLogin(false);
      setEmail("");
      setPassword("");
    });
  };

  const openRegisterPopup = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowLogin(false);
      setShowRegister(true);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      registerSlideAnim.setValue(screenHeight);
      Animated.spring(registerSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  const closeRegisterPopup = () => {
    Animated.timing(registerSlideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowRegister(false);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    });
  };

  const openLoginFromRegister = () => {
    Animated.timing(registerSlideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowRegister(false);
      setShowLogin(true);
      slideAnim.setValue(screenHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  const openFindIdPopup = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowLogin(false);
      setShowFindId(true);
      setFindIdName("");
      setFindIdResult(null);
      findIdSlideAnim.setValue(screenHeight);
      Animated.spring(findIdSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  const closeFindIdPopup = () => {
    Animated.timing(findIdSlideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFindId(false);
      setFindIdName("");
      setFindIdResult(null);
    });
  };

  const openFindPasswordPopup = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowLogin(false);
      setShowFindPassword(true);
      setFindPwEmail("");
      setFindPwName("");
      setFindPwVerified(false);
      setFindPwSuccess(false);
      setFindPwNewPassword("");
      findPasswordSlideAnim.setValue(screenHeight);
      Animated.spring(findPasswordSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  const closeFindPasswordPopup = () => {
    Animated.timing(findPasswordSlideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFindPassword(false);
      setFindPwEmail("");
      setFindPwName("");
      setFindPwVerified(false);
      setFindPwNewPassword("");
      setFindPwSuccess(false);
    });
  };

  const openLoginFromFindId = () => {
    Animated.timing(findIdSlideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowFindId(false);
      setShowLogin(true);
      slideAnim.setValue(screenHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  const openLoginFromFindPassword = () => {
    Animated.timing(findPasswordSlideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowFindPassword(false);
      setShowLogin(true);
      slideAnim.setValue(screenHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  const handleFindId = async () => {
    if (!findIdName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    setIsFindIdSubmitting(true);
    setFindIdResult(null);
    try {
      const data = await authApi.findId(findIdName);
      setFindIdResult(data.email);
    } catch (error) {
      alert(error instanceof Error ? error.message : "조회에 실패했습니다.");
    } finally {
      setIsFindIdSubmitting(false);
    }
  };

  const handleVerifyForPasswordReset = async () => {
    if (!findPwName.trim() || !findPwEmail.trim()) {
      alert("이름과 이메일을 모두 입력해주세요.");
      return;
    }
    setIsFindPwSubmitting(true);
    try {
      await authApi.findPassword(findPwName, findPwEmail);
      setFindPwVerified(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "본인 확인에 실패했습니다.");
    } finally {
      setIsFindPwSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!findPwNewPassword.trim()) {
      alert("새 비밀번호를 입력해주세요.");
      return;
    }
    setIsFindPwSubmitting(true);
    try {
      await authApi.resetPassword(findPwName, findPwEmail, findPwNewPassword);
      setFindPwSuccess(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setIsFindPwSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await authApi.login(email, password);
      await AuthManager.login(data.token, data.account);
      router.replace("/(tabs)/home" as any);
    } catch (error) {
      alert(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      alert("구글 로그인을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("구글 로그인 요청 실패:", error);
      alert("구글 로그인 중 문제가 발생했습니다.");
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (accessToken: string | undefined) => {
    if (!accessToken) {
      alert("구글 인증 토큰을 받을 수 없습니다.");
      setIsGoogleLoading(false);
      return;
    }
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoRes.ok) throw new Error("사용자 정보를 가져올 수 없습니다.");
      const googleUserInfo = await userInfoRes.json();
      const data = await authApi.googleAuth({
        googleId: googleUserInfo.sub,
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        picture: googleUserInfo.picture,
      });
      await AuthManager.login(data.token, data.account);
      router.replace("/(tabs)/home" as any);
    } catch (error) {
      alert(error instanceof Error ? error.message : "구글 로그인에 실패했습니다.");
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleAuthSuccess(response.authentication?.accessToken);
    } else if (response?.type === "error") {
      console.error("구글 로그인 에러:", response.error);
      alert("구글 로그인에 실패했습니다.");
      setIsGoogleLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      alert("이름, 이메일, 비밀번호를 모두 입력해주세요.");
      return;
    }
    setIsRegSubmitting(true);
    try {
      await authApi.register(regName, regEmail, regPassword);
      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      closeRegisterPopup();
      setShowLogin(true);
      slideAnim.setValue(screenHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } catch (error) {
      alert(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setIsRegSubmitting(false);
    }
  };

  const handleDevLogin = async () => {
    setIsSubmitting(true);
    try {
      const data = await authApi.login("Developer@test.net", "1234");
      await AuthManager.login(data.token, data.account);
      router.replace("/(tabs)/home" as any);
    } catch (error) {
      alert(error instanceof Error ? error.message : "개발자 로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/background/Loading.png")}
        style={styles.background}
        resizeMode="stretch"
        imageStyle={styles.backgroundImage}
      >
        <TouchableOpacity
          style={styles.tapArea}
          activeOpacity={1}
          onPress={handleTapToLogin}
          disabled={!isComplete}
        >
          <View style={styles.bottomContent}>
            {!isComplete ? (
              <>
                <Text style={styles.loadingMessage}>{LOADING_MESSAGE}</Text>
                <View style={styles.loadingBarWrap}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.tapSection}>
                <Text style={styles.tapText}>Tap To Login</Text>
                <Text style={styles.tapHint}>화면을 탭하여 로그인</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </ImageBackground>

      {/* 로그인 팝업 - 로딩 화면 위에 로그인 박스만 하단에서 슬라이드업 */}
      {showLogin && (
        <>
          <TouchableOpacity
            style={styles.loginBackdrop}
            activeOpacity={1}
            onPress={closeLoginPopup}
          />
          <Animated.View
            style={[
              styles.loginPopupWrapper,
              {
                transform: [{ translateY: slideAnim }],
                paddingBottom: insets.bottom,
                height: screenHeight * 0.75,
              },
            ]}
          >
            {/* 로그인 카드 */}
            <View style={[styles.loginCard, { backgroundColor: APP_COLORS.ivory, borderColor: APP_COLORS.yellow }]}>
              <ScrollView
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  style={styles.input}
                  placeholder="이메일"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor={APP_COLORS.brownLight}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="비밀번호"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TouchableOpacity
                  style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={APP_COLORS.brown} />
                  ) : (
                    <Text style={styles.loginButtonText}>로그인</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>또는</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.googleButton, (!request || isGoogleLoading) && styles.googleButtonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={!request || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator color="#3c4043" />
                  ) : (
                    <>
                      <Image source={require("../assets/images/icons/google.png")} style={styles.googleIcon} resizeMode="contain" />
                      <Text style={styles.googleButtonText}>Google 계정으로 로그인</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.devButton} onPress={handleDevLogin}>
                  <Text style={styles.devButtonText}>개발자 모드 로그인</Text>
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                  <TouchableOpacity onPress={openFindPasswordPopup}>
                    <Text style={styles.linkText}>비밀번호 찾기</Text>
                  </TouchableOpacity>
                  <Text style={styles.separator}>|</Text>
                  <TouchableOpacity onPress={openFindIdPopup}>
                    <Text style={styles.linkText}>아이디 찾기</Text>
                  </TouchableOpacity>
                  <Text style={styles.separator}>|</Text>
                  <TouchableOpacity onPress={openRegisterPopup}>
                    <Text style={styles.linkText}>회원가입</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}

      {/* 회원가입 팝업 - 로그인 박스와 동일 UI */}
      {showRegister && (
        <>
          <TouchableOpacity
            style={styles.loginBackdrop}
            activeOpacity={1}
            onPress={closeRegisterPopup}
          />
          <Animated.View
            style={[
              styles.loginPopupWrapper,
              {
                transform: [{ translateY: registerSlideAnim }],
                paddingBottom: insets.bottom,
                height: screenHeight * 0.75,
              },
            ]}
          >
            <View style={[styles.loginCard, { backgroundColor: APP_COLORS.ivory, borderColor: APP_COLORS.yellow }]}>
              <ScrollView
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  style={styles.input}
                  placeholder="이름"
                  value={regName}
                  onChangeText={setRegName}
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TextInput
                  style={styles.input}
                  placeholder="이메일"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  placeholderTextColor={APP_COLORS.brownLight}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="비밀번호"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TouchableOpacity
                  style={[styles.loginButton, isRegSubmitting && styles.loginButtonDisabled]}
                  onPress={handleRegister}
                  disabled={isRegSubmitting}
                >
                  {isRegSubmitting ? (
                    <ActivityIndicator color={APP_COLORS.brown} />
                  ) : (
                    <Text style={styles.loginButtonText}>회원가입</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backToLoginLink} onPress={openLoginFromRegister}>
                  <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인하기</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}

      {/* 아이디 찾기 팝업 */}
      {showFindId && (
        <>
          <TouchableOpacity
            style={styles.loginBackdrop}
            activeOpacity={1}
            onPress={closeFindIdPopup}
          />
          <Animated.View
            style={[
              styles.loginPopupWrapper,
              {
                transform: [{ translateY: findIdSlideAnim }],
                paddingBottom: insets.bottom,
                height: screenHeight * 0.75,
              },
            ]}
          >
            <View style={[styles.loginCard, { backgroundColor: APP_COLORS.ivory, borderColor: APP_COLORS.yellow }]}>
              <ScrollView
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  style={styles.input}
                  placeholder="이름"
                  value={findIdName}
                  onChangeText={setFindIdName}
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TouchableOpacity
                  style={[styles.loginButton, isFindIdSubmitting && styles.loginButtonDisabled]}
                  onPress={handleFindId}
                  disabled={isFindIdSubmitting}
                >
                  {isFindIdSubmitting ? (
                    <ActivityIndicator color={APP_COLORS.brown} />
                  ) : (
                    <Text style={styles.loginButtonText}>아이디 찾기</Text>
                  )}
                </TouchableOpacity>

                {findIdResult !== null && (
                  <View style={styles.resultBox}>
                    <Text style={styles.resultText}>회원님의 아이디는 "{findIdResult}" 입니다</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.backToLoginLink} onPress={openLoginFromFindId}>
                  <Text style={styles.linkText}>로그인하기</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}

      {/* 비밀번호 찾기 팝업 */}
      {showFindPassword && (
        <>
          <TouchableOpacity
            style={styles.loginBackdrop}
            activeOpacity={1}
            onPress={closeFindPasswordPopup}
          />
          <Animated.View
            style={[
              styles.loginPopupWrapper,
              {
                transform: [{ translateY: findPasswordSlideAnim }],
                paddingBottom: insets.bottom,
                height: screenHeight * 0.75,
              },
            ]}
          >
            <View style={[styles.loginCard, { backgroundColor: APP_COLORS.ivory, borderColor: APP_COLORS.yellow }]}>
              <ScrollView
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {!findPwVerified ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="이름"
                      value={findPwName}
                      onChangeText={setFindPwName}
                      placeholderTextColor={APP_COLORS.brownLight}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="이메일"
                      value={findPwEmail}
                      onChangeText={setFindPwEmail}
                      placeholderTextColor={APP_COLORS.brownLight}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />

                    <TouchableOpacity
                      style={[styles.loginButton, isFindPwSubmitting && styles.loginButtonDisabled]}
                      onPress={handleVerifyForPasswordReset}
                      disabled={isFindPwSubmitting}
                    >
                      {isFindPwSubmitting ? (
                        <ActivityIndicator color={APP_COLORS.brown} />
                      ) : (
                        <Text style={styles.loginButtonText}>확인</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : !findPwSuccess ? (
                  <>
                    <Text style={styles.newPasswordLabel}>새로운 비밀번호를 입력하세요</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="새 비밀번호"
                      value={findPwNewPassword}
                      onChangeText={setFindPwNewPassword}
                      placeholderTextColor={APP_COLORS.brownLight}
                      secureTextEntry
                    />

                    <TouchableOpacity
                      style={[styles.loginButton, isFindPwSubmitting && styles.loginButtonDisabled]}
                      onPress={handleResetPassword}
                      disabled={isFindPwSubmitting}
                    >
                      {isFindPwSubmitting ? (
                        <ActivityIndicator color={APP_COLORS.brown} />
                      ) : (
                        <Text style={styles.loginButtonText}>비밀번호 변경</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backToLoginLink} onPress={() => setFindPwVerified(false)}>
                      <Text style={styles.linkText}>이전으로</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.resultBox}>
                      <Text style={styles.resultText}>비밀번호가 변경되었습니다.</Text>
                    </View>

                    <TouchableOpacity style={styles.backToLoginLink} onPress={openLoginFromFindPassword}>
                      <Text style={styles.linkText}>로그인하기</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  tapArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomContent: {
    paddingHorizontal: 40,
    paddingBottom: 56,
    alignItems: "center",
  },
  loadingMessage: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 20,
    fontFamily: "KotraHope",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  loadingBarWrap: {
    width: "100%",
    marginTop: 8,
  },
  progressTrack: {
    width: "100%",
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: APP_COLORS.yellow,
    borderRadius: 6,
  },
  tapSection: {
    alignItems: "center",
  },
  tapText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "KotraHope",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  tapHint: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 6,
    fontFamily: "KotraHope",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // 로그인 팝업 - 로딩 화면 뒤에 보임
  loginBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  loginPopupWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  loginCard: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 0,
    borderWidth: 2,
    paddingTop: 36,
    elevation: 8,
    shadowColor: APP_COLORS.brown,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardScrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
    width: "100%",
    fontFamily: "KotraHope",
  },
  loginButton: {
    backgroundColor: APP_COLORS.yellow,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: APP_COLORS.brown,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: APP_COLORS.ivoryDark,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dadce0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: "#3c4043",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "KotraHope",
  },
  devButton: {
    backgroundColor: APP_COLORS.ivoryDark,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: APP_COLORS.brownLight,
  },
  devButtonText: {
    color: APP_COLORS.brown,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkText: {
    fontSize: 16,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  separator: {
    fontSize: 16,
    color: APP_COLORS.ivoryDark,
  },
  backToLoginLink: {
    alignItems: "center",
    marginTop: 16,
  },
  resultBox: {
    backgroundColor: APP_COLORS.ivoryDark,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.yellowDark,
  },
  resultText: {
    fontSize: 16,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  newPasswordLabel: {
    fontSize: 16,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 12,
  },
});
