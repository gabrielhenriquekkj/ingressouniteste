function logger(req, res, next) {
  const inicio = Date.now()

  res.on('finish', () => {
    const duracao = Date.now() - inicio
    console.log(`[${req.method}] ${req.url} ${res.statusCode} ${duracao}ms`)
  })

  next()
}

module.exports = logger
