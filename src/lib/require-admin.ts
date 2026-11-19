import 'server-only'
import { getCurrentUser } from '@/lib/current-user'

export async function requireAdmin() {
    const user = await getCurrentUser()

    if (user?.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    return user
}