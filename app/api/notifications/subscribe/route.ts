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

    // Verificar si el token ya existe
    const { data: existingToken } = await supabase
      .from('notification_tokens')
      .select('id')
      .eq('token', token)
      .single()

    if (existingToken) {
      return NextResponse.json({
        success: true,
        message: 'Token ya registrado'
      })
    }

    // Insertar nuevo token
    const { error } = await supabase
      .from('notification_tokens')
      .insert({
        token,
        created_at: new Date().toISOString(),
        is_active: true
      })

    if (error) {
      console.error('Error al guardar token:', error)
      return NextResponse.json(
        { success: false, message: 'Error al guardar token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción a notificaciones exitosa'
    })

  } catch (error) {
    console.error('Error en suscripción a notificaciones:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
