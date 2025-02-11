const paginationNavDOM = document.getElementById('paginationNav')
const colUserDOM = document.getElementById('colUser')
const colPostDOM = document.getElementById('colPost')
const contentDOM = document.getElementById('content')
const commentDOM = document.getElementById('comments')
let currentPageIdx = 0
let currentUserId = undefined
let currentPostId = undefined
let currentCommentId = undefined

const loginDOM = document.getElementById('login')
const signupDOM = document.getElementById('signUp')
const containerDOM = document.getElementById('container')

function toSignup() {
  loginDOM.classList.add('hide')
  signupDOM.classList.remove('hide')
  containerDOM.classList.add('hide')
}

function toLogin() {
  loginDOM.classList.remove('hide')
  signupDOM.classList.add('hide')
  containerDOM.classList.add('hide')
}

function toContainer() {
  loginDOM.classList.add('hide')
  signupDOM.classList.add('hide')
  containerDOM.classList.remove('hide')
  fetchUser(0)
}

function handleLogin() {
  const floatingInput = document.getElementById('floatingInput')
  const floatingPassword = document.getElementById('floatingPassword')
  if (floatingInput.value === '' || floatingPassword.value === '') {
    alert('Please fill out all fields')
    return
  }
  fetch('/clients/login', {
    method: 'POST',
    body: JSON.stringify({
      email: floatingInput.value,
      password: floatingPassword.value,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.json()).then(res => {
    if (res.token) {
      localStorage.setItem('token', res.token)
      window.location.href = '/'
    } else if (res.error) {
      alert(res.error)
    }
  })
}

function handleSignup() {
  const floatingInputSignFirst = document.getElementById(
    'floatingInputSignFirst')
  const floatingInputSignLast = document.getElementById('floatingInputSignLast')
  const floatingInputSign = document.getElementById('floatingInputSign')
  const floatingPasswordSign = document.getElementById('floatingPasswordSign')
  if (
    !floatingInputSignFirst || !floatingInputSignLast || !floatingInputSignFirst || !floatingPasswordSign
  ) {
    alert('Please fill out all fields')
    return
  }
  fetch('/clients/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: floatingInputSignFirst.value,
      lastName: floatingInputSignLast.value,
      email: floatingInputSign.value,
      password: floatingPasswordSign.value,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.json()).then(res => {
    if (res.id) {
      alert('Sign up success')
      localStorage.setItem('token', res.token)
      toLogin()
    } else if (res.error) {
      alert(res.error)
    }
  })
}
const limit = 5;
function fetchUser(skip) {
    clearPostDOM();
    clearContentDOM();
    clearCommentDOM();
    currentPageIdx = skip
    fetch(`/users?limit=5&skip=${skip * 5}&select=id,firstName,age,lastName`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    })
    .then(res => {
    if (res.status === 401) {
      alert('Please login')
      toLogin()
      localStorage.removeItem('token')
      throw new Error('Please login')
    } else {
      return res
    }
    })
    .then(res => res.json())
    .then(res => {
    const totalPages = Math.ceil(res.total / limit);
    console.log(totalPages);
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
        ${Array.from({ length: totalPages }).map((_, idx) => `
                  <li class="page-item ${skip === idx ? 'active' : ''}">
                    <a onclick="fetchUser(${idx}, 5)" class="page-link" href="#">${idx + 1}</a>
                  </li>
                `).join('')}
        <li class="page-item">
          <a
            onclick="fetchUser(${skip + 1})"
            ${
              skip === totalPages - 1 ? 'disabled' : ''
            }
            class="page-link ${skip === totalPages - 1 ? 'disabled' : ''}" href="#"
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
clearContentDOM();
clearCommentDOM();
  fetch(`/users/${userId}/posts`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
  .then(res => {
    if (res.status === 401) {
      alert('Please login')
      toLogin()
      localStorage.removeItem('token')
      throw new Error('Please login')
    } else {
      return res
    }
  })
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
  fetch(`/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
  .then(res => {
    if (res.status === 401) {
      alert('Please login')
      toLogin()
      localStorage.removeItem('token')
      throw new Error('Please login')
    } else {
      return res
    }
  })
  .then(res => res.json())
  .then(res => {
    contentDOM.innerHTML = `

      <h1 class="mt-5">${res.title}</h1>
      <p class="lead">${res.body}</p>

    `
  })
}

function fetchComments(postId) {
  fetch(`/posts/${postId}/comments`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
  .then(res => {
    if (res.status === 401) {
      alert('Please login')
      toLogin()
      localStorage.removeItem('token')
      throw new Error('Please login')
    } else {
      return res
    }
  })
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
                  <h6 class="mb-0">${comment.user.firstName}
                    ${comment.user.lastName}</h6>
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

function checkAuth() {
  const token = localStorage.getItem('token')
  if (!token) {
    toLogin()
  } else {
    toContainer()
  }
}

checkAuth()

function clearPostDOM(){
    colPostDOM.innerHTML = '';
}

function clearContentDOM() {
  contentDOM.innerHTML = '';
}
function clearCommentDOM() {
  commentDOM.innerHTML = '';
}
