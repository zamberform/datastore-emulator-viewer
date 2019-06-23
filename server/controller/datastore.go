package controller

import (
	"net/http"
	"server/model"

	"cloud.google.com/go/datastore"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/context"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
)

var ctx = context.Background()
var currentId string
var dsClient *datastore.Client
var currentKinds string

func getDatastore(projectId string, hostInfo string) (err error) {
	dsClient, err = datastore.NewClient(ctx, projectId, option.WithEndpoint(hostInfo), option.WithoutAuthentication(), option.WithGRPCDialOption(grpc.WithInsecure()))
	return
}

func getMap(ctx context.Context, key *datastore.Key) (map[string]interface{}, error) {
	res := map[string]interface{}{}

	list := &datastore.PropertyList{}
	err := dsClient.Get(ctx, key, list)
	if err != nil {
		return nil, err
	}
	for _, v := range *list {
		switch t := res[v.Name].(type) {
		case nil:
			res[v.Name] = []interface{}{v.Value}
		case []interface{}:
			res[v.Name] = append(t, v.Value)
		}
		continue
		res[v.Name] = v.Value
	}
	return res, nil
}

func GetNamespaces(c *gin.Context) {
	targetId := c.Param("id")
	var targetData model.Project
	db.Load(targetId, &targetData)

	if len(currentId) <= 0 || currentId != targetId {
		currentId = targetId
		err := getDatastore(targetData.ProjectId, targetData.ApiEndpoint)
		if err != nil {
			c.JSON(http.StatusExpectationFailed, err)
		}
	}
	q := datastore.NewQuery("__namespace__").KeysOnly()
	keys, err := dsClient.GetAll(ctx, q, nil)
	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}

	namespaces := make([]string, 0, len(keys))
	for _, namespace := range keys {
		namespaces = append(namespaces, namespace.Name)
	}

	c.JSON(http.StatusOK, namespaces)
}

func GetNamespaceKinds(c *gin.Context) {
	targetNspace := c.Param("namespace")
	targetId := c.Param("id")
	var targetData model.Project
	db.Load(targetId, &targetData)

	if len(currentId) <= 0 || currentId != targetId {
		currentId = targetId
		err := getDatastore(targetData.ProjectId, targetData.ApiEndpoint)
		if err != nil {
			c.JSON(http.StatusExpectationFailed, err)
		}
	}

	q := datastore.NewQuery("__kind__").KeysOnly()
	keys, err := dsClient.GetAll(ctx, q, nil)
	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}

	kinds := make([]string, 0, len(keys))
	for _, kind := range keys {
		if kind.Namespace == targetNspace {
			kinds = append(kinds, kind.Name)
		}
	}
	c.JSON(http.StatusOK, kinds)
}

func QueryBy(c *gin.Context) {
targetId := c.Param("id")
	var targetData model.Project
	db.Load(targetId, &targetData)
	if len(currentId) <= 0 || currentId != targetId {
		currentId = targetId
		err := getDatastore(targetData.ProjectId, targetData.ApiEndpoint)
		if err != nil {
			c.JSON(http.StatusExpectationFailed, err)
		}
	}

	currentKinds = c.Query("kinds")
	targetNspace := c.Query("namespace")
	if targetNspace == "null" {
		targetNspace = ""
	}

	query := datastore.NewQuery(currentKinds).KeysOnly()

	keys, err := dsClient.GetAll(ctx, query, nil)

	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}

	finalResultSlice := make([]map[string]interface{}, len(keys))

	for index, key := range keys {
		if key.Namespace == targetNspace {
			targetName := key.Name
			searchKey := datastore.NameKey(currentKinds, targetName, nil)
			results, err := getMap(ctx, searchKey)
			if err != nil {
				c.JSON(http.StatusExpectationFailed, err)
				break
			}

			resultSlice := map[string]interface{}{}
			for k, v := range results {
				resultSlice[k] = v
				resultSlice["key_name"] = key.Name
			}

			finalResultSlice[index] = resultSlice
		}
	}

	c.JSON(http.StatusOK, finalResultSlice)
}

func DeleteData(c *gin.Context) {
	targetId := c.Param("id")
	var targetData model.Project
	db.Load(targetId, &targetData)

	if len(currentId) <= 0 || currentId != targetId {
		currentId = targetId
		err := getDatastore(targetData.ProjectId, targetData.ApiEndpoint)
		if err != nil {
			c.JSON(http.StatusExpectationFailed, err)
		}
	}

	targetNspace := c.Param("namesp")
	if targetNspace == "null" {
		targetNspace = ""
	}
	var deleteQuery []string
	err := c.ShouldBind(&deleteQuery)
	if err != nil {
		c.JSON(http.StatusExpectationFailed, err)
	}

	for _, deleteKeyName := range deleteQuery {
		key := datastore.NameKey(currentKinds, deleteKeyName, nil)

		if key.Namespace == targetNspace {
			if err := dsClient.Delete(ctx, key); err != nil {
				c.JSON(http.StatusExpectationFailed, err)
			} else {
				c.JSON(http.StatusOK, "")
			}
		}
	}
}
