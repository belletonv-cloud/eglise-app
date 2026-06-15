import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from './setup'

// VITE_VAPID_PUBLIC_KEY is set in .env (loaded by Vitest),
// so vapidConfigured will be true during tests.

const notificationMocks = vi.hoisted(() => ({
  isPushSupported: vi.fn(),
  getNotificationPermission: vi.fn(),
  requestPermission: vi.fn(),
  subscribeToPush: vi.fn(),
  registerToken: vi.fn(),
  unsubscribe: vi.fn(),
  getExistingSubscription: vi.fn(),
  extractFCMToken: vi.fn(),
}))

vi.mock('../utils/notifications', () => ({
  isPushSupported: notificationMocks.isPushSupported,
  getNotificationPermission: notificationMocks.getNotificationPermission,
  requestPermission: notificationMocks.requestPermission,
  subscribeToPush: notificationMocks.subscribeToPush,
  registerToken: notificationMocks.registerToken,
  unsubscribe: notificationMocks.unsubscribe,
  getExistingSubscription: notificationMocks.getExistingSubscription,
  extractFCMToken: notificationMocks.extractFCMToken,
}))

import NotificationPrefs from '../components/NotificationPrefs.vue'

const flush = async () => {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('NotificationPrefs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationMocks.isPushSupported.mockReturnValue(true)
    notificationMocks.getNotificationPermission.mockReturnValue('default')
    notificationMocks.getExistingSubscription.mockResolvedValue(null)
  })

  const baseProps = { memberId: 1 }

  it('renders notification preferences container', () => {
    const wrapper = mount(NotificationPrefs, { props: baseProps })
    expect(wrapper.find('.notification-prefs').exists()).toBe(true)
  })

  it('shows permission status label with granted status', () => {
    notificationMocks.getNotificationPermission.mockReturnValue('granted')
    const wrapper = mount(NotificationPrefs, { props: baseProps })
    expect(wrapper.text()).toContain('Notifications push :')
    expect(wrapper.text()).toContain('Autorisé')
  })

  it('shows permission as "Bloqué" when denied', () => {
    notificationMocks.getNotificationPermission.mockReturnValue('denied')
    const wrapper = mount(NotificationPrefs, { props: baseProps })
    expect(wrapper.text()).toContain('Bloqué')
  })

  it('shows enable button when permission is default', () => {
    const wrapper = mount(NotificationPrefs, { props: baseProps })
    expect(wrapper.text()).toContain('Activer les notifications')
  })

  it('shows subscribe button when permission is granted and not subscribed', () => {
    notificationMocks.getNotificationPermission.mockReturnValue('granted')
    const wrapper = mount(NotificationPrefs, { props: baseProps })
    expect(wrapper.text()).toContain("S'abonner aux notifications")
  })

  it('does not show subscribe button when already subscribed', async () => {
    notificationMocks.getNotificationPermission.mockReturnValue('granted')
    notificationMocks.getExistingSubscription.mockResolvedValue({
      endpoint: 'https://example.com/push/abc',
    })
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn() },
          showNotification: vi.fn(),
        }),
      },
      writable: true,
      configurable: true,
    })
    const wrapper = mount(NotificationPrefs, { props: baseProps })
    await flush()
    expect(wrapper.text()).toContain('Se désabonner')
    expect(wrapper.text()).toContain('Notifications activées')
    expect(wrapper.text()).not.toContain("S'abonner aux notifications")
  })
})
