import { Badge } from '@/components/ui/badge'
import { playerDisplayName, playerPositions, playerSide, POSITION_LABELS } from '@/lib/public'
import type { Player } from '@/lib/types'

export function PlayerName({ player }: { player: Player }) {
  return <span aria-label={player.name} title={player.name}>{playerDisplayName(player)}{player.nickname?.trim() && <span className="sr-only"> · {player.name}</span>}</span>
}
export function PlayerPositions({ player }: { player: Player }) {
  const positions = playerPositions(player)
  const side = playerSide(player)
  return <div className="flex flex-wrap gap-2 text-xs">
    {positions.map((position, index) => <Badge key={position} variant={index === 0 ? 'default' : 'secondary'}>{POSITION_LABELS[position]} · {index === 0 ? 'Principal' : 'Secundaria'}</Badge>)}
    {!positions.length && <span className="text-muted-foreground">{player.positions.length && player.primary_position === undefined ? player.positions.join(' · ') : 'Posición por definir'}</span>}
    <Badge variant="outline">Lado: {({ L: 'Izquierdo', R: 'Derecho', C: 'Centro', ANY: 'Libre' })[side]}</Badge>
    <Badge variant="outline">Pie: {player.foot ? ({ L: 'Izquierdo', R: 'Derecho', BOTH: 'Ambos' })[player.foot] : 'Sin registrar'}</Badge>
  </div>
}
