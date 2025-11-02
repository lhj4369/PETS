class AuthManager {
  private isLoggedInFlag = false;

  // 로그인 상태 확인
  async isLoggedIn(): Promise<boolean> {
    return this.isLoggedInFlag;
  }

  // 로그인 처리
  async login(): Promise<void> {
    this.isLoggedInFlag = true;
  }

  // 로그아웃 처리
  async logout(): Promise<void> {
    this.isLoggedInFlag = false;
  }
}

export default new AuthManager();

