import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, response: NextResponse) {
  let supabaseResponse = response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Clonar la respuesta existente (que ya viene con next-intl)
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Copiar headers de la respuesta original a la nueva (para no perder next-intl)
          response.headers.forEach((value, key) => {
            supabaseResponse.headers.set(key, value)
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() valida el token contra Supabase (no sólo lee la cookie) y de paso
  // lo refresca. Devolvemos el usuario para que el middleware pueda decidir
  // sobre rutas protegidas sin volver a consultar.
  const { data: { user } } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
