import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/signin',
  },
})

export const config = {
  matcher: [
    '/api/story-spec',
    '/api/carousel',
    '/api/tts',
    '/api/video',
    '/api/music',
  ],
}
