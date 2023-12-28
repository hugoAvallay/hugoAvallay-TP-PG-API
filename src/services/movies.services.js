const db = require("../database/models")
const createError = require('http-errors')

const getAllMovies = async (limit, offset) => {
    try {

        const movies = await db.Movie.findAll({
            limit,
            offset,
            attributes: {
                exclude: ['created_at', 'updated_at','genre_id']
            },

            include: [
                {
                    association: 'genre',
                    attributes: ['id','name']

                },
                {
                    association: 'actors',
                    attributes: ['id','first_name', 'last_name']

                }
            ]
        })

        const total = await db.Movie.count()

        return {
            movies,
            total
        }
    } catch (error) {
        console.log(error);
        throw {
            status: 500,
            message: error.message
        }
    }
    

    return movies
}

const getMovieByPk = async (id) => {
    try {
        if (!id) throw createError(400, 'ID fallida')

        const movie = await db.Movie.findByPk(id,{
            attributes: {
                exclude: ['created_at', 'updated_at','genre_id']
            },

            include: [
                {
                    association: 'genre',
                    attributes: ['id','name']

                },
                {
                    association: 'actors',
                    attributes: ['id','first_name', 'last_name']
                }
            ]
        })

        if(!movie) throw createError(404, 'No existe esa pelic con ese ID')

        return {
            movie
        }

    } catch (error) {
        console.log(error);
        throw {
            status: error.status || 500,
            message: error.message || 'upss, chigo un error'
        }
    }
}

const createMovie = async (dataMovie, actors) => {
    try {

        const newMovie = await db.Movie.create(dataMovie);

        if (actors) {
            const actorsDB = actors.map(actor => {
                return {
                    movie_id: newMovie.id,
                    actor_id: actor
                }
            })
            await db.Actor_Movie.bulkCreate(actorsDB, {
                validate: true
            })
        }

        return newMovie

    } catch (error) {
        console.log(error);
        throw {
            status: error.status || 500,
            message: error.message || 'upss, chigo un error'
        }
    }
};

const updateMovie = async (id,dataMovie) => {
    try {

        const {title, awards, rating, release_date, length, genre_id, actors} = dataMovie

        const movie = await db.Movie.findByPk(id)

        movie.title = title || movie.title
        movie.awards = awards || movie.awards
        movie.rating = rating || movie.rating
        movie.release_date = release_date || movie.release_date
        movie.length = length || movie.length
        movie.genre_id = genre_id || movie.genre_id

        await movie.save();

        if (actors) {
            await db.Actor_Movie.destroy({
                where: {
                    movie_id: id
                }
            })

            const actorsArray = actors.map(actor => {
                return {
                    movie_id: id,
                    actor_id: actor
                }
            })
            await db.Actor_Movie.bulkCreate(actorsArray, {
                validate: true
            })
        }
        
        


        return movie

    } catch (error) {
        console.log(error);
        throw {
            status: error.status || 500,
            message: error.message || 'upss, chigo un error'
        }
    }
}

const deleteMovie = async (id) => {
    try {
        
        await db.Actor_Movie.destroy({
            where: {
                movie_id: id
            }
        })

        const movie = await db.Movie.findByPk(id)
        await movie.destroy()
        return null
    } catch (error) {
        console.log(error);
    throw {
        status: error.status || 500,
        message: error.message || 'upss, chigo un error'
    }
    }
}


module.exports = {
    getAllMovies,
    getMovieByPk,
    createMovie,
    updateMovie,
    deleteMovie
}