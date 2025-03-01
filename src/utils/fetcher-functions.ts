

import strapi from "./strapi";


const getDjQuestions = async () => {
    try {
        const response = await strapi.get('/discovery-jar-questions?filters[answer]&populate=*');
        return response.data.data;
    } catch (error) {
        console.log(error);
    }
}

export { getDjQuestions };