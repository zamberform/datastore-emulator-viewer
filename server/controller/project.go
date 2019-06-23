package controller

import (
	"encoding/json"
	"net/http"
	"server/middleware"
	"server/model"
	"strconv"

	"github.com/gin-gonic/gin"
)

var db = middleware.JsonDB{}

func GetSavedProjects(c *gin.Context) {

	saveDatas, _ := db.LoadAll()

	projects := make([]model.Project, len(saveDatas))
	for index, saveString := range saveDatas {
		var realData model.Project
		err := json.Unmarshal([]byte(saveString), &realData)
		if err != nil {
			c.JSON(http.StatusExpectationFailed, err)
		}
		projects[index] = realData
	}

	c.JSON(http.StatusOK, projects)
}

func AddProject(c *gin.Context) {
	saveDatas, _ := db.LoadAll()
	var idNum = len(saveDatas)
	var insertData model.Project
	err := c.ShouldBind(&insertData)
	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}
	insertData.ID = idNum + 1
	err = db.AddData(strconv.Itoa(insertData.ID), insertData)
	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}
	c.JSON(http.StatusOK, insertData)
}

func RemoveProject(c *gin.Context) {
	removeId := c.Param("id")

	err := db.RemoveData(removeId)
	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}
	c.JSON(http.StatusOK, nil)
}
