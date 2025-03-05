import axios from "axios";


const BASEURL = `http://localhost:1337/api`
const strapi = axios.create({
    baseURL: BASEURL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + "7aa71c747b0df74c8d61eeed634c88b1e263ca2b6db22acc23d5fd4cbad007b1460a3dcb6786bca847795082024adaa74957fc5eb5c6c1327c6fe887c291843eb63e3a9e19c66160e6a7c0ee47aa82503985aa7efc54ed576b87123c73c530e8284ce3ebc1a926f5d75db4c42ea8178b4446f564f8a74f13d3f04884f86bae8e"
    },
})

export default strapi;