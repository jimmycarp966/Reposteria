import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de notificación requerido' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient()

    // Desactivar el token
    const { error } = await supabase
      .from('notification_tokens')
      .update({ is_active: false })
      .eq('token', token)

    if (error) {
      console.error('Error al desactivar token:', error)
      return NextResponse.json(
        { success: false, message: 'Error al desactivar token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Desuscripción de notificaciones exitosa'
    })

  } catch (error) {
    console.error('Error en desuscripción de notificaciones:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
