import request from '../lib/api'

function accountLoginRequest() {
  return request.get({
    url: '127.0.0.1:3000/home/info'
  })
}

accountLoginRequest().then(res => {
  console.log(res)
})
