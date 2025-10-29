
import { useEffect, useMemo, useRef, useState } from 'react'

type Position = "C" | "1B" | "2B" | "3B" | "SS" | "OF" | "UT" | "SP" | "RP"
type Stats = Record<string, number>
type Player = { id: string; name: string; team: string; position: Position; stats: Stats }
type TeamResp = { userId: string; teamName: string; totalPoints: number; players: Array<{id:string;name:string;position:Position;team:string;points:number}>}
type DraftState = { isActive: boolean; onTheClockUserId?: string; pickEndsAt?: number; pickSeconds: number; order: string[] }

const API = import.meta.env.VITE_API_BASE ?? "http://localhost:5174"

export default function DraftDemo(){
  const userId = "u1"
  const [players, setPlayers] = useState<Player[]>([])
  const [team, setTeam] = useState<TeamResp | null>(null)
  const [state, setState] = useState<DraftState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/players`).then(r=>r.json()),
      fetch(`${API}/api/team/${userId}`).then(async r => r.ok ? r.json() : ({ userId, teamName: 'Team Demo', totalPoints: 0, players: [] })),
      fetch(`${API}/api/draft/state`).then(r=>r.json())
    ]).then(([ps, t, st])=>{
      setPlayers(ps); setTeam(t); setState(st)
    }).catch(e=> setError(String(e))).finally(()=> setLoading(false))
  }, [])

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        await fetch(`${API}/api/draft/tick`, {method:'POST'})
        const [st, t] = await Promise.all([
          fetch(`${API}/api/draft/state`).then(r=>r.json()),
          fetch(`${API}/api/team/${userId}`).then(r=>r.json())
        ])
        setState(st); setTeam(t)
      } catch(e) {}
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const remainingMs = useMemo(()=>{
    if (!state?.pickEndsAt) return 0
    const ms = state.pickEndsAt - Date.now()
    return ms > 0 ? ms : 0
  }, [state?.pickEndsAt])

  async function pick(pid: string){
    setError(null)
    const res = await fetch(`${API}/api/draft/pick`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ userId, playerId: pid }) })
    const data = await res.json()
    if (!res.ok || !data.ok) { setError(data.error ?? "Pick failed"); return }
    const t = await fetch(`${API}/api/team/${userId}`).then(r=>r.json())
    setTeam(t); setNotice("Picked!"); setTimeout(()=> setNotice(null), 1500)
  }

  async function remove(pid: string){
    setError(null)
    const res = await fetch(`${API}/api/draft/remove`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ userId, playerId: pid }) })
    if (!res.ok) { setError("Remove failed"); return }
    const t = await fetch(`${API}/api/team/${userId}`).then(r=>r.json())
    setTeam(t)
  }

  const draftedIds = new Set(team?.players.map(p=>p.id) ?? [])

  if (loading) return <div className="card">Loading…</div>
  if (error) return <div className="card">Error: {error}</div>

  return (
    <div className="grid">
      <section className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h2 style={{margin:0}}>Draft Room</h2>
          <div className="pill timer">⏱ {Math.ceil(remainingMs/1000)}s</div>
        </div>
        {notice && <div className="pill" role="status" aria-live="polite">{notice}</div>}
      </section>

      <section className="card">
        <h3 style={{marginTop:0}}>Available Players</h3>
        <table>
          <thead>
            <tr>
              <th>Player</th><th>Team</th><th>Pos</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => {
              const disabled = draftedIds.has(p.id)
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="muted">{p.team}</td>
                  <td><span className="pill">{p.position}</span></td>
                  <td><button className="btn" disabled={disabled} onClick={()=>pick(p.id)}>{disabled ? 'Drafted' : 'Draft'}</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h3 style={{marginTop:0}}>Your Team</h3>
          <div>Total Points: <strong>{team?.totalPoints ?? 0}</strong></div>
        </div>
        {(!team || team.players.length === 0) ? <p className="muted">No players selected yet.</p> : (
          <table>
            <thead><tr><th>Player</th><th>Pos</th><th>Pts</th><th></th></tr></thead>
            <tbody>
              {team.players.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><span className="pill">{p.position}</span></td>
                  <td>{p.points.toFixed(2)}</td>
                  <td><button className="btn secondary" onClick={()=>remove(p.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
