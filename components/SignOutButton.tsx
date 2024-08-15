'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/') // Redirect to home page after sign out
      router.refresh() // Refresh the current page to update the UI
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-red-500 hover:text-white focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    >
      Sign Out
    </button>
  )
}