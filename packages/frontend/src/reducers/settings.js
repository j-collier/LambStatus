import { LIST_SETTINGS, EDIT_SETTINGS, EDIT_LOGO, REMOVE_LOGO, ADD_API_KEY,
         REMOVE_API_KEY } from 'actions/settings'

function listSettingsHandler (state = { }, action) {
  if (action.settings.apiKeys) {
    action.settings.apiKeys.sort((a, b) => {
      if (a.createdDate < b.createdDate) return -1
      if (a.createdDate > b.createdDate) return 1
      return 0
    })
  }

  return Object.assign({}, state, {
    settings: action.settings
  })
}

function editSettingsHandler (state = { }, action) {
  return Object.assign({}, state, {
    settings: {
      ...state.settings,
      ...action.settings
    }
  })
}

function editLogoHandler (state = { }, action) {
  return Object.assign({}, state, {
    settings: {
      ...state.settings,
      logoID: action.logo.id
    }
  })
}

function removeLogoHandler (state = { }, action) {
  return Object.assign({}, state, {
    settings: {
      ...state.settings,
      logoID: ''
    }
  })
}

function addApiKeyHandler (state = { }, action) {
  return Object.assign({}, state, {
    settings: {
      ...state.settings,
      apiKeys: [...state.settings.apiKeys, action.apiKey]
    }
  })
}

function removeApiKeyHandler (state = { }, action) {
  return Object.assign({}, state, {
    settings: {
      ...state.settings,
      apiKeys: state.settings.apiKeys.filter(key => key.id !== action.keyID)
    }
  })
}

const ACTION_HANDLERS = {
  [LIST_SETTINGS]: listSettingsHandler,
  [EDIT_SETTINGS]: editSettingsHandler,
  [EDIT_LOGO]: editLogoHandler,
  [REMOVE_LOGO]: removeLogoHandler,
  [ADD_API_KEY]: addApiKeyHandler,
  [REMOVE_API_KEY]: removeApiKeyHandler
}

export default function settingsReducer (state = {
  settings: {}
}, action) {
  const handler = ACTION_HANDLERS[action.type]
  return handler ? handler(state, action) : state
}
