'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                },
            },
        })

        if (error) {
            setError('Erro ao criar conta. Tente novamente.')
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <h1>BuscaLead</h1>
                    </div>
                    <div className="success-message">
                        ✅ Conta criada! Verifique seu e-mail para confirmar o cadastro.
                    </div>
                    <p className="auth-link" style={{ marginTop: '1.5rem' }}>
                        <Link href="/login">Voltar para login</Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>BuscaLead</h1>
                    <p>Crie sua conta gratuita</p>
                </div>

                <form className="auth-form" onSubmit={handleSignup}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="name">Nome</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="loading-spinner" /> : 'Criar Conta'}
                    </button>
                </form>

                <p className="auth-link">
                    Já tem conta? <Link href="/login">Fazer login</Link>
                </p>
            </div>
        </div>
    )
}
