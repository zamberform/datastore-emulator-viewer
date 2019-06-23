package model

type Project struct {
	ID          int    `json:"id"`
	ProjectId   string `json:"projectId"`
	ApiEndpoint string `json:"apiEndpoint"`
}
