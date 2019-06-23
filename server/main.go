package main

import (
	"server/router"

	"github.com/gin-gonic/gin"
)

func main() {
	app := gin.Default()
	router.Route(app)
	app.Run(":8000")
}
