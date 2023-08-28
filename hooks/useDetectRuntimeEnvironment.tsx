import { isMobile } from 'react-device-detect'

type RuntimeEnv = 'not-mobile' | 'mobile-not-installed' | 'pwa'

const useDetectRuntimeEnvironment = () => {
  const isStandaloneMode = (global.navigator as any)?.standalone === true

  let envMode: RuntimeEnv = 'pwa'
  if (isMobile === false) {
    envMode = 'not-mobile'
  } else if (isMobile === true && isStandaloneMode === false) {
    envMode = 'mobile-not-installed'
  } else if (isMobile === true && isStandaloneMode === true) {
    envMode = 'pwa'
  }
  // Uncomment to test locally on desktop
  // envMode = 'pwa'

  return envMode
}

export { useDetectRuntimeEnvironment }
