export class SwarmClient {
  #apiUrl = 'http://localhost:1633'
  constructor(
    { apiUrl }: { apiUrl?: string } = {},
  ) {
    if (apiUrl) this.#apiUrl = apiUrl
  }
  async upload(...files: File[]) {
    const fd = new FormData()

    for (const file of files) fd.append('file', file)

    const res = await fetch(`${this.#apiUrl}/bzz`, {
      method: 'POST',
      body: fd,
    })
    return await res.json()
  }
}
