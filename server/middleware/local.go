package middleware

import (
	scribble "github.com/nanobox-io/golang-scribble"
)

type JsonDBer interface {
	Foo1()
	Foo2()
	Foo3()
}

type JsonDB struct {
}

var db, _ = scribble.New("./store", nil)

var collectionString = "datastore_emulator"

func (jsonDb JsonDB) LoadAll() ([]string, error) {

	return db.ReadAll(collectionString)
}

func (jsonDb JsonDB) Load(reourceName string, v interface{}) error {

	return db.Read(collectionString, reourceName, v)
}

func (jsonDb JsonDB) AddData(resourceName string, v interface{}) error {

	return db.Write(collectionString, resourceName, v)
}

func (jsonDb JsonDB) RemoveData(resourceName string) error {

	return db.Delete(collectionString, resourceName)
}
