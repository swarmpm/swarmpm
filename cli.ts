import { CLI } from 'https://deno.land/x/spektr@0.0.5/spektr.ts'

const cli = new CLI({ name: 'swarmpm' })

cli.command('pack', () => {
  console.log('hello')
}, {
  options: [] as const,
})

cli.handle(Deno.args)
