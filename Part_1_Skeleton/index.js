const paginationNavDOM = document.getElementById('paginationNav')
const colUserDOM = document.getElementById('colUser')
const colPostDOM = document.getElementById('colPost')
const contentDOM = document.getElementById('content')
const commentDOM = document.getElementById('comments')
let currentPageIdx = 0
let currentUserId = undefined
let currentPostId = undefined
let currentCommentId = undefined

function fetchUser(skip) {
  currentPageIdx = skip
  fetch(`https://dummyjson.com/users?limit=5&skip=${skip * 5}&select=id,firstName,age,lastName`)
  .then(res => res.json())
  .then(res => {
    paginationNavDOM.innerHTML = `
      <ul class="pagination justify-content-center">
        <li
          class="page-item ${skip === 0 ? 'disabled' : ''}"
        >
          <a
            onclick="fetchUser(${skip - 1})"
            ${
              skip === 0 ? 'disabled' : ''
            }
            class="page-link"
          >Previous</a>
        </li>
        <li class="page-item">
          <a
            onclick="fetchUser(${skip + 1})"
            ${
              skip === res.total ? 'disabled' : ''
            }
            class="page-link ${skip === res.total ? 'disabled' : ''}" href="#"
          >Next</a>
        </li>
      </ul>`

    colUserDOM.innerHTML = `

      ${
      res.users.map(user => `
        <div class="position-relative">
          <input
            class="form-check-input position-absolute top-50 end-0 me-3 fs-5"
            type="radio"
            name="listGroupRadioGrid"
            id="listGroupRadioGrid${user.id}"
            value=""
            onclick="fetchPost(${user.id})"
            ${
              currentUserId === user.id ? 'checked' : ''
            }
          >
          <label
            class="list-group-item py-3 pe-5"
            for="listGroupRadioGrid${user.id}"
          >
            <strong class="fw-semibold">${user.firstName}
              ${user.lastName}</strong>
              <!--            <span class="d-block small opacity-75">Age: ${user.age}
              </span>-->
          </label>
        </div>
      `).join('')
    }
    `

  })
}

function fetchPost(userId) {
  fetch(`https://dummyjson.com/users/${userId}/posts`)
  .then(res => res.json())
  .then(res => {
    currentUserId = userId
    colPostDOM.innerHTML = `
    ${
      res.posts.map(post => `
        <input
          class="list-group-item-check pe-none"
          type="radio"
          name="listGroupCheckableRadios"
          id="listGroupCheckableRadios${post.id}"
          value=""
          onclick="fetchDetail('${post.id}')"
        >
        <label
          class="list-group-item rounded-3 py-3"
          for="listGroupCheckableRadios${post.id}"
        >
          ${
            post.title
          }
          <span class="d-block small opacity-50">
            ${
              post.tags
            }
          </span>
        </label>
      `).join('')
    }
    `
  })
}

function fetchDetail(id) {
  fetchText(id)
  fetchComments(id)
}

function fetchText(id) {
  fetch(`https://dummyjson.com/posts/${id}`)
  .then(res => res.json())
  .then(res => {
    contentDOM.innerHTML = `

      <h1 class="mt-5">${res.title}</h1>
      <p class="lead">${res.body}</p>

    `
  })
}

function fetchComments(postId) {
  fetch(`https://dummyjson.com/posts/${postId}/comments`)
  .then(res => res.json())
  .then(res => {

    commentDOM.innerHTML = `
      <div class="list-group m-0 mw-100">
        ${
          res.comments.map(comment => `
            <a
              href="#"
              class="list-group-item list-group-item-action d-flex gap-3 py-3"
              aria-current="true"
            >
              <img
                src="https://github.com/twbs.png"
                alt="twbs"
                width="32"
                height="32"
                class="rounded-circle flex-shrink-0"
              >
              <div class="d-flex gap-2 w-100 justify-content-between">
                <div>
                  <h6 class="mb-0">${comment.user.username}</h6>
                  <p class="mb-0 opacity-75">${comment.body}</p>
                </div>
              </div>
            </a>
          `).join('')
        }
      </div>
    `
  })
}

fetchUser(currentPageIdx)
