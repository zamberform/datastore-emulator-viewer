import React, { Component } from 'react'
import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Typography,
  IconButton
} from '@material-ui/core'
import { ChevronLeft, Menu, AddCircle, Delete } from '@material-ui/icons'
import { withStyles } from '@material-ui/core/styles'
import { css } from 'glamor'
import { Div } from 'glamorous'
import { sortBy } from 'lodash'
import axios from 'axios'

import DatastorePage from './DatastorePage'
import ProjectDialog from './ProjectDialog'
import ConfirmDialog from './ConfirmDialog'

const styles = theme => ({
  content: {
    flexGrow: 1,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  }
})

class ProjectList extends Component {
  state = {
    currentProj: null,
    projects: [],
    drawerOpen: true,
    projectDialogOpen: false,
    errorDialogOpen: false,
    errorMsg: "",
    removeId: null
  }

  async componentDidMount() {
    try {
      const { data } = await axios.get('/projects')
      this.setState({ projects: sortBy(data, 'projectId', 'apiEndpoint') })
      this.setState({ currentProj: this.state.projects[0] })
    } catch (error) {
      const {
        status,
        statusText
      } = error.response;
      console.log(`Error! HTTP Status: ${status} ${statusText}`)
      this.setState({ errorDialogOpen: true, errorMsg: statusText})
    }
    
  }

  addProject = project => {
    this.setState({
      projects: sortBy(
        [...this.state.projects, project],
        'projectId',
        'apiEndpoint'
      )
    })

    this.setState({ currentProj: project })
  }

  removeProject = async id => {
    await axios.post(`/projects/${id}/remove`)
    this.setState({
      projects: this.state.projects.filter(p => p.id !== id)
    })

    this.setState({ currentProj: this.state.projects[0] })
  }

  render() {
    const { projects, drawerOpen, projectDialogOpen, removeId, errorDialogOpen, errorMsg } = this.state
    const { match, classes } = this.props
    const { kind } = match.params

    return (
      <Div position="absolute" top={0} bottom={0} left={0} right={0}>
        <Drawer
          variant="persistent"
          open={drawerOpen}
          classes={{ paper: css({ width: 240 }).toString() }}
        >
          <Toolbar disableGutters>
            <IconButton
              onClick={() => this.setState({ projectDialogOpen: true })}
              color="primary"
            >
              <AddCircle />
            </IconButton>
            <Typography
              variant="subheading"
              color="inherit"
              className={css({ flex: 1 }).toString()}
            >
              Emulators
            </Typography>
            <IconButton onClick={() => this.setState({ drawerOpen: false })}>
              <ChevronLeft />
            </IconButton>
          </Toolbar>
          <Divider />
          <List classes={{ root: css({ flex: 1 }).toString() }}>
            {projects.map(({ id, projectId, apiEndpoint }, index) => (
              <ListItem
                key={id}
                button
                onClick={() => this.setState({ currentProj: projects[index] })}
              >
                <ListItemText primary={projectId} secondary={apiEndpoint} />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => this.setState({ removeId: id })}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Div
          display="flex"
          flexDirection="column"
          height="100%"
          overflow="hidden"
          marginLeft={drawerOpen ? 240 : undefined}
          className={classes.content}
        >
          <AppBar position="static" color="default">
            <Toolbar>
              {!drawerOpen && (
                <IconButton onClick={() => this.setState({ drawerOpen: true })}>
                  <Menu />
                </IconButton>
              )}
              <Typography variant="title">
                Datastore Emulator Viewer
              </Typography>
            </Toolbar>
          </AppBar>
          <Div flex={1} overflow="hidden">
            {this.state.currentProj && <DatastorePage id={this.state.currentProj.id} kind={kind} />}
          </Div>
        </Div>
        <ProjectDialog
          open={projectDialogOpen}
          onClose={() => this.setState({ projectDialogOpen: false })}
          onSaved={this.addProject}
        />
        <ConfirmDialog
          open={!!removeId}
          text={
            !!removeId &&
            `Remove the project ${
              projects.find(({ id }) => id === removeId).projectId
            } from the list?`
          }
          confirmLabel="Remove"
          onClose={() => this.setState({ removeId: null })}
          onConfirm={() => this.removeProject(removeId)}
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

export default withStyles(styles)(ProjectList)
