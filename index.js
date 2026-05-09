if (!sock.authState.creds.registered) {
  const phoneNumber = '+93703930172'

  setTimeout(async () => {
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`PAIRING CODE: ${code}`)
  }, 5000)
}
