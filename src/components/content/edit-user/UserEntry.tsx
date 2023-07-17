import { useState } from 'react'
import { User } from '../../../modules/users'
import { Detail } from '../form/Form'
import './UserEntry.scss'

// This will render the basic editable
// details of the mission itself.
export default function UserEntry(props: {
  user: User
  handleChange: () => void
}): JSX.Element | null {
  let user: User = props.user
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT EFFECTS -- */

  /* -- COMPONENT FUNCTIONS -- */
  const renderUsernameInfo = () => {
    // if (user.userID !== '') {
    //   return (
    //     <div className='UsernameContainer'>
    //       <div className='Title'>Username:</div>
    //       <div className='Username'>{user.userID}</div>
    //     </div>
    //   )
    // } else {
    return (
      <Detail
        label='Username'
        initialValue={user.userID}
        emptyStringAllowed={false}
        deliverValue={(userID: string) => {
          if (userID !== user.userID && userID !== '') {
            user.userID = userID
            handleChange()
          }
        }}
        // key={`userID=${user.userID}_field=userID`}
      />
    )
    // }
  }

  /* -- RENDER -- */

  return (
    <div className='UserEntry'>
      {/* {renderUsernameInfo()} */}
      <div className='RoleContainer'>
        <div className='Title'>Role:</div>
        <div className='Role'>{user.role}</div>
      </div>
      <Detail
        label='First Name'
        initialValue={user.firstName}
        emptyStringAllowed={false}
        deliverValue={(firstName: string) => {
          if (firstName !== user.firstName && firstName !== '') {
            user.firstName = firstName
            handleChange()
          }
        }}
        key={`userID=${user.userID}_field=firstName`}
      />
      <Detail
        label='Last Name'
        initialValue={user.lastName}
        emptyStringAllowed={false}
        deliverValue={(lastName: string) => {
          if (lastName !== user.lastName && lastName !== '') {
            user.lastName = lastName
            handleChange()
          }
        }}
        key={`userID=${user.userID}_field=lastName`}
      />
    </div>
  )
}
