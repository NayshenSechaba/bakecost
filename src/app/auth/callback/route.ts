import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user?.email) {
      // Fetch bakery name from user metadata or bakeries table
      const bakeryName = data.user.user_metadata?.bakery_name || 'your bakery'
      
      // Send welcome email asynchronously
      sendWelcomeEmail({
        email: data.user.email,
        bakeryName,
      }).catch(err => console.error('Error sending welcome email in callback:', err))

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}
