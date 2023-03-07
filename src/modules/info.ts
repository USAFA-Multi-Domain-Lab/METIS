import axios from 'axios'

// This will get the changelog for the
// application and return it via the
// callback function.
export function getChangelog(
  callback: (info: string) => void = () => {},
  callbackError: (error: Error) => void = (error: Error) => {},
): void {
  axios
    .get('/api/v1/info/changelog/')
    .then((response) => {
      callback(response.data.changelog)
    })
    .catch((error) => {
      console.error('Failed to get changelog:')
      console.error(error)
      callbackError(error)
    })
}

export default {
  getChangelog,
}
