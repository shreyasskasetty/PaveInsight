export {default} from 'next-auth/middleware'
export const config = { matcher: ["/admin/dashboard","/admin/requests","/admin/requests/[id]"] }