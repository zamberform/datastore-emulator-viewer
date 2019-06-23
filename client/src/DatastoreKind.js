import React, { Component } from 'react'
import { css } from 'glamor'
import { Div } from 'glamorous'
import axios from 'axios'
import { AutoSizer, InfiniteLoader, Column, Table } from 'react-virtualized'
import 'react-virtualized/styles.css'
import { sortBy } from 'lodash'
import { Button, Checkbox, IconButton, Snackbar } from '@material-ui/core'
import { Visibility } from '@material-ui/icons'

import ConfirmDialog from './ConfirmDialog'
import EntityDialog from './EntityDialog'

export default class DatastoreKind extends Component {
  state = {
    entities: null,
    moreResults: false,
    columns: [],
    selectedKeys: [],
    promptDelete: false,
    errorDialog: false,
    errorMsg: ""
  }

  componentDidMount() {
    this.runQuery()
  }

  componentDidUpdate({ kind }) {
    if (this.props.kind !== kind) {
      this.runQuery()
    }
  }

  runQuery = async () => {
    this.moreResults = true
    this.setState({
      entities: null,
      moreResults: false,
      columns: [],
      selectedKeys: []
    })
    this.getQueryReqults()
  }

  getQueryReqults = async () => {
    if (!this.moreResults) {
      return
    }
    this.moreResults = false
    this.setState({ loading: true })
    const { id, kind, namespace } = this.props
    try {
      const { data } = await axios.get(
        `/datastore/${id}/query?namespace=${namespace}&kinds=${kind}`
      )
      
      const columns = sortBy(Object.keys(data[0]))
      this.setState({
        loading: false,
        entities: data,
        columns: sortBy(columns).map(key => ({
          dataKey: key,
          label: key === 'key_name' ? 'KeyName' : key,
          width: 200
        }))
      })
    } catch (error) {
      const {
        status,
        statusText
      } = error.response;
      console.log(`Error! HTTP Status: ${status} ${statusText}`)
      this.setState({ loading: false, errorDialogOpen: true, errorMsg: statusText})
    }
    
  }

  getRowData = i => {
    return this.state.entities[i]
  }

  deleteEntities = async () => {
    const { entities, selectedKeys } = this.state
    this.setState({
      selectedKeys: [],
      entities: entities.filter(
        entity => !selectedKeys.includes(entity.key_name)
      ),
      deleting: true
    })
    const { id, namespace } = this.props
    try {
      await axios.post(`/datastore/${id}/${namespace}/delete`, selectedKeys)
    } catch (error) {
      const {
        status,
        statusText
      } = error.response;
      console.log(`Error! HTTP Status: ${status} ${statusText}`)
      this.setState({ errorDialogOpen: true, errorMsg: statusText})
    }
    this.setState({ deleting: false })
  }

  render() {
    const {
      columns,
      entities,
      selectedKeys,
      viewedEntity,
      loading,
      deleting,
      promptDelete,
      errorDialogOpen,
      errorMsg
    } = this.state

    return (
      <Div flex={1} display="flex" flexDirection="column">
        <Div>
          <Button onClick={() => this.runQuery()} color="primary">
            Refresh
          </Button>
          <Button
            onClick={() => this.setState({ promptDelete: true })}
            disabled={selectedKeys.length === 0}
            color="primary"
          >
            Delete
          </Button>
        </Div>
        <Div flex={1} fontSize="small">
          {entities && (
            <AutoSizer>
              {({ height, width }) => (
                <InfiniteLoader
                  isRowLoaded={({ index }) => !!entities[index]}
                  loadMoreRows={this.getQueryReqults}
                  rowCount={10000}
                >
                  {({ onRowsRendered, registerChild }) => (
                    <Table
                      headerHeight={30}
                      height={height}
                      onRowsRendered={onRowsRendered}
                      ref={registerChild}
                      rowCount={entities.length}
                      rowGetter={({ index }) => this.getRowData(index)}
                      rowHeight={30}
                      width={width}
                      headerClassName={css({
                        textTransform: 'none !important'
                      }).toString()}
                      gridClassName={css({
                        outline: 'none !important'
                      }).toString()}
                    >
                      <Column
                        dataKey="key_name"
                        minWidth={100}
                        width={100}
                        cellRenderer={({ rowIndex }) => (
                          <Div display="flex">
                            <Checkbox
                              checked={selectedKeys.includes(
                                entities[rowIndex].key_name
                              )}
                              onChange={() => {
                                const key = entities[rowIndex].key_name
                                this.setState({
                                  selectedKeys: selectedKeys.includes(key)
                                    ? selectedKeys.filter(k => k !== key)
                                    : [...selectedKeys, key]
                                })
                              }}
                              color="primary"
                            />
                            <IconButton
                              onClick={() =>
                                this.setState({
                                  viewedEntity: entities[rowIndex]
                                })
                              }
                            >
                              <Visibility />
                            </IconButton>
                          </Div>
                        )}
                      />
                      {columns.map(({ dataKey, label, width }) => (
                        <Column
                          key={dataKey}
                          dataKey={dataKey}
                          label={label}
                          width={width}
                        />
                      ))}
                    </Table>
                  )}
                </InfiniteLoader>
              )}
            </AutoSizer>
          )}
        </Div>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={deleting || loading}
          message={deleting ? 'Deleting...' : 'Loading...'}
        />
        <EntityDialog
          entity={viewedEntity}
          onClose={() => this.setState({ viewedEntity: null })}
        />
        <ConfirmDialog
          open={promptDelete}
          text={
            selectedKeys.length === 1
              ? 'Delete entity?'
              : `Delete ${selectedKeys.length} entities?`
          }
          confirmLabel="Delete"
          onClose={() => this.setState({ promptDelete: false })}
          onConfirm={this.deleteEntities}
        />
        <ConfirmDialog
          open={errorDialogOpen || false}
          text={errorMsg}
          confirmLabel="OK"
          onConfirm={() => this.setState({ errorDialogOpen: false, errorMsg: "" })}
          onClose={() => this.setState({ errorDialogOpen: false, errorMsg: "" })}
        />
      </Div>
    )
  }
}
