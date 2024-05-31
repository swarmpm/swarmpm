import { CLI } from 'https://deno.land/x/spektr@0.0.5/spektr.ts'
import { SwarmClient } from './swarm.ts'

const cli = new CLI({ name: 'swarmpm' })

const swarm = new SwarmClient()

cli.command('pack', () => {
}, {
  options: [] as const,
})

cli.handle(Deno.args)
