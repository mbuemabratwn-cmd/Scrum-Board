import { FirebaseError } from 'firebase/app'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth, hasFirebaseConfig } from '../config/firebase'

type AuthField = 'email' | 'password' | 'nickname' | 'form'

export type AuthFieldErrors = Partial<Record<AuthField, string>>

const MISSING_CONFIG_MESSAGE = 'Firebase 配置缺失'

let persistenceReady: Promise<void> | null = null

export const firebaseAuthAvailable = hasFirebaseConfig && Boolean(auth)

async function getAuthInstance() {
  if (!auth || !hasFirebaseConfig) {
    throw new Error(MISSING_CONFIG_MESSAGE)
  }

  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
      persistenceReady = null
      throw error
    })
  }

  await persistenceReady
  return auth
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<UserCredential> {
  const authInstance = await getAuthInstance()
  return signInWithEmailAndPassword(authInstance, email, password)
}

export async function registerWithPassword(
  email: string,
  password: string,
  nickname: string,
): Promise<UserCredential> {
  const authInstance = await getAuthInstance()
  const credential = await createUserWithEmailAndPassword(authInstance, email, password)
  const displayName = nickname.trim()

  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }

  return credential
}

export async function signOutCurrentUser() {
  const authInstance = await getAuthInstance()
  await signOut(authInstance)
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  if (!auth || !hasFirebaseConfig) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export function getAuthFieldErrors(error: unknown): AuthFieldErrors {
  if (error instanceof Error && error.message === MISSING_CONFIG_MESSAGE) {
    return { form: '请先在 .env 文件中配置 Firebase 参数后再登录。' }
  }

  if (!(error instanceof FirebaseError)) {
    return { form: '请求失败，请稍后再试。' }
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return { email: '邮箱格式不正确。' }
    case 'auth/user-not-found':
      return { email: '账号不存在，请先注册。' }
    case 'auth/email-already-in-use':
      return { email: '该邮箱已注册，请直接登录。' }
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return { password: '邮箱或密码错误。' }
    case 'auth/missing-password':
      return { password: '请输入密码。' }
    case 'auth/weak-password':
      return { password: '密码至少 6 位。' }
    case 'auth/network-request-failed':
      return { form: '网络异常，请检查连接后重试。' }
    default:
      return { form: '认证失败，请稍后再试。' }
  }
}
