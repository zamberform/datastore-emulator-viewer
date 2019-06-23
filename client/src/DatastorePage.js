import React, { Component } from 'react'
import { withRouter, Link } from 'react-router-dom'
import { css } from 'glamor'
import { Div } from 'glamorous'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Snackbar
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import axios from 'axios'
import { sortBy } from 'lodash'

import DatastoreKind from './DatastoreKind'
import ConfirmDialog from './ConfirmDialog'

class DatastorePage extends Component {
  state = {
    currentNsp: null,
    namespaces: [null],
    kinds: [],
    currentKind: null,
    errorDialog: false,
    errorMsg: ""
  }

  componentDidMount() {
    this.loadNamespaces()
    this.loadKinds()
  }

  componentDidUpdate({ id, match }) {
    if (this.props.id !== id) {
      this.setState({
        currentNsp: null,
        namespaces: [null],
        kinds: [],
        currentKind: null
      })
      this.loadNamespaces()
      this.loadKinds()
    } else if (this.props.match.params.namespace !== match.params.namespace) {
      this.setState({ kinds: [] })
      this.loadKinds()
    }
  }

  loadNamespaces = async () => {
    this.setState({ loadingNamespaces: true })
    try {
      const { data } = await axios.get(`/datastore/${this.props.id}/namespaces`)
      this.setState({
        loadingNamespaces: false,
        namespaces: sortBy(data),
        currentNsp: this.state.namespaces[0]
      })
    } catch (error) {
      const {
        status,
        statusText
      } = error.response;
      console.log(`Error! HTTP Status: ${status} ${statusText}`)
      this.setState({ errorDialogOpen: true, errorMsg: statusText})
    }
    
  }

  loadKinds = async () => {
    this.setState({ loadingKinds: true })
    const namespace = this.state.currentNsp || '[default]'
    try {
      const { data } = await axios.get(
        `/datastore/${this.props.id}/kinds?namespace=${namespace}`
      )
      this.setState({
        loadingKinds: false,
        kinds: sortBy(data),
        currentKind: this.state.kinds[0]
      })
    } catch (error) {
      const {
        status,
        statusText
      } = error.response;
      console.log(`Error! HTTP Status: ${status} ${statusText}`)
      this.setState({ errorDialogOpen: true, errorMsg: statusText})
    }
    
  }

  render() {
    const { id, theme } = this.props
    const { namespaces, kinds, loadingNamespaces, loadingKinds, currentNsp, currentKind, errorDialogOpen, errorMsg } = this.state

    return (
      <Div display="flex" height="100%">
        <Div
          display="flex"
          flexDirection="column"
          overflow="auto"
          width={240}
          borderRight={`1px solid ${theme.palette.divider}`}
        >
          <Div padding={10}>
            <FormControl fullWidth>
              <InputLabel shrink htmlFor="namespace">
                Namespace
              </InputLabel>
              <Select
                displayEmpty
                value={currentNsp || ''}
                onChange={e => {
                    this.loadKinds()
                    this.setState({
                      currentNsp: e.target.value || '[default]',
                    })
                    
                  }
                }
                inputProps={{ name: 'namespace' }}
              >
                {namespaces.map(namespace => (
                  <MenuItem key={namespace} value={namespace || ''}>
                    {namespace || 'Default'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Div>
          <List dense>
            {kinds.map(k => (
              <ListItem
                key={k}
                button
                component={Link}
                to={`/${id}/${k}?namespace=${currentNsp || '[default]'}/`}
                classes={
                  k === this.state.kind
                    ? {
                        root: css({
                          backgroundColor: `${
                            theme.palette.action.selected
                          } !important`
                        }).toString()
                      }
                    : undefined
                }
                onClick={() => this.setState({ currentKind: k })}
              >
                <ListItemText primary={k} />
              </ListItem>
            ))}
          </List>
        </Div>
        {currentKind && <DatastoreKind id={id} namespace={currentNsp} kind={currentKind} />}
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={loadingNamespaces || loadingKinds}
          message="Loading..."
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

export default withRouter(
  withStyles(undefined, { withTheme: true })(DatastorePage)
)
