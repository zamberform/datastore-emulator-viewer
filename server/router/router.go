package router

import (
	"server/controller"

	"github.com/gin-gonic/gin"
)

func Route(router *gin.Engine) {
	api := router.Group("projects")
	api.GET("", controller.GetSavedProjects)
	api.POST("", controller.AddProject)
	api.POST("/:id/remove", controller.RemoveProject)

	datastoreApi := router.Group("datastore/:id/")
	datastoreApi.GET("/namespaces", controller.GetNamespaces)
	datastoreApi.GET("/kinds", controller.GetNamespaceKinds)
	datastoreApi.GET("/query", controller.QueryBy)
	datastoreApi.POST("/:namesp/delete", controller.DeleteData)
}
