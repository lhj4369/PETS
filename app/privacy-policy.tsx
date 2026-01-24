import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
import { Platform } from "react-native";

export default function PrivacyPolicyScreen() {
  const handleEmailPress = () => {
    const email = "privacy@pets-app.com"; // 실제 이메일 주소로 변경 필요
    const url = Platform.OS === "web" 
      ? `mailto:${email}`
      : `mailto:${email}`;
    Linking.openURL(url).catch((err) => console.error("이메일 열기 실패:", err));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>개인정보처리방침</Text>
        <Text style={styles.appName}>PETS</Text>
        <Text style={styles.lastUpdated}>최종 수정일: 2026년 1월 20일</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 개인정보의 처리 목적</Text>
          <Text style={styles.text}>
            PETS 앱은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </Text>
          <Text style={styles.subText}>
            • 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적
          </Text>
          <Text style={styles.subText}>
            • 운동 기록 관리: 사용자의 운동 기록(타이머 기록, 운동 세트, 심박수 등) 저장 및 관리
          </Text>
          <Text style={styles.subText}>
            • Google Fit 연동: Google Fit API를 통한 걸음 수, 이동 거리, 심박수 등 건강 데이터 수집 및 표시
          </Text>
          <Text style={styles.subText}>
            • 서비스 개선: 서비스 이용 통계 분석, 신규 서비스 개발, 맞춤형 서비스 제공
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 개인정보의 처리 및 보유기간</Text>
          <Text style={styles.text}>
            • 회원 정보: 회원 탈퇴 시까지 보유 (단, 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)
          </Text>
          <Text style={styles.text}>
            • 운동 기록: 회원 탈퇴 시까지 보유
          </Text>
          <Text style={styles.text}>
            • 법적 분쟁 관련 데이터: 분쟁 해결 완료 후 30일간 보관 후 삭제
          </Text>
          <Text style={styles.text}>
            • 계정 생성 및 삭제 로그: 삭제 요청 후 30일간 보관 후 삭제
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 처리하는 개인정보의 항목</Text>
          <Text style={styles.subTitle}>필수 항목:</Text>
          <Text style={styles.text}>• 계정 정보: 이메일 주소, 이름, 비밀번호(암호화 저장)</Text>
          <Text style={styles.text}>• 선택 항목: 닉네임</Text>
          
          <Text style={styles.subTitle}>자동 수집 항목:</Text>
          <Text style={styles.text}>• 운동 기록: 타이머 기록, 운동 세트, 심박수 측정 데이터</Text>
          <Text style={styles.text}>• Google Fit 데이터: 걸음 수, 이동 거리, 심박수 (사용자가 Google Fit 연동을 선택한 경우)</Text>
          <Text style={styles.text}>• 앱 사용 데이터: 성취 및 도전 과제, 랭킹 데이터, 채팅 기록</Text>
          <Text style={styles.text}>• 기기 정보: 기기 식별자, OS 버전 (서비스 제공 및 오류 해결 목적)</Text>
          
          <Text style={styles.note}>
            ※ 카메라 데이터: 심박수 측정을 위해 카메라를 사용하지만, 촬영한 영상/이미지는 저장되지 않으며 실시간으로만 분석됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 개인정보의 제3자 제공</Text>
          <Text style={styles.text}>
            PETS 앱은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
          </Text>
          <Text style={styles.text}>
            • 이용자가 사전에 동의한 경우
          </Text>
          <Text style={styles.text}>
            • 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
          </Text>
          <Text style={styles.text}>
            • Google Fit API: 사용자가 Google Fit 연동을 선택한 경우, Google의 개인정보처리방침이 적용됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 개인정보처리의 위탁</Text>
          <Text style={styles.text}>
            PETS 앱은 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
          </Text>
          <Text style={styles.text}>
            • 클라우드 서비스 제공업체: 서버 운영 및 데이터 저장 (서비스 제공업체의 개인정보처리방침 준수)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 정보주체의 권리·의무 및 그 행사방법</Text>
          <Text style={styles.text}>
            이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
          </Text>
          <Text style={styles.text}>
            • 개인정보 열람요구: 앱 내 "설정" 메뉴에서 본인의 개인정보를 확인할 수 있습니다.
          </Text>
          <Text style={styles.text}>
            • 개인정보 정정·삭제요구: 앱 내 "설정" 메뉴에서 개인정보를 수정하거나, "계정 삭제"를 통해 계정 및 모든 데이터를 삭제할 수 있습니다.
          </Text>
          <Text style={styles.text}>
            • 처리정지 요구: 개인정보 처리정지 요구는 앱 내 "설정 > 계정 삭제"를 통해 가능합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 개인정보의 파기</Text>
          <Text style={styles.text}>
            PETS 앱은 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
          </Text>
          <Text style={styles.text}>
            • 파기 절차: 이용자가 요청한 경우 즉시 삭제 (단, 법적 요구사항에 따라 30일간 보관 후 삭제)
          </Text>
          <Text style={styles.text}>
            • 파기 방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 개인정보 보호책임자</Text>
          <Text style={styles.text}>
            PETS 앱은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </Text>
          <Text style={styles.text}>
            • 연락처: privacy@pets-app.com (실제 이메일 주소로 변경 필요)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 개인정보의 안전성 확보 조치</Text>
          <Text style={styles.text}>
            PETS 앱은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
          </Text>
          <Text style={styles.text}>
            • 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육
          </Text>
          <Text style={styles.text}>
            • 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치
          </Text>
          <Text style={styles.text}>
            • 물리적 조치: 전산실, 자료보관실 등의 접근통제
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 개인정보 처리방침 변경</Text>
          <Text style={styles.text}>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. 만 13세 미만 아동의 개인정보 처리</Text>
          <Text style={styles.text}>
            PETS 앱은 만 13세 미만 아동의 개인정보를 수집하지 않습니다. 만 13세 미만 아동이 서비스를 이용하려면 법정대리인의 동의가 필요합니다.
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>문의사항</Text>
          <Text style={styles.contactText}>
            개인정보 처리와 관련한 문의사항이 있으시면 아래로 연락해 주시기 바랍니다.
          </Text>
          <Text style={styles.contactEmail} onPress={handleEmailPress}>
            privacy@pets-app.com
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: 'KotraHope',
  },
  appName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: 'KotraHope',
  },
  lastUpdated: {
    fontSize: 14,
    color: "#999",
    marginBottom: 32,
    textAlign: "center",
    fontFamily: 'KotraHope',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  text: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  subText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
    marginBottom: 6,
    paddingLeft: 12,
    fontFamily: 'KotraHope',
  },
  note: {
    fontSize: 14,
    color: "#888",
    lineHeight: 20,
    marginTop: 12,
    fontStyle: "italic",
    fontFamily: 'KotraHope',
  },
  contactSection: {
    marginTop: 32,
    marginBottom: 40,
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  contactText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  contactEmail: {
    fontSize: 16,
    color: "#007AFF",
    textDecorationLine: "underline",
    fontFamily: 'KotraHope',
  },
});
