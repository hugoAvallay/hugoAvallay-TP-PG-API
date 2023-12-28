const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment');
const { getAllMovies, getMovieByPk, createMovie, updateMovie, deleteMovie } = require('../services/movies.services');
const { count } = require('console');
const paginate = require('express-paginate');
const createError = require('http-errors')


//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;


const moviesController = {
    'list': async (req, res) => {
        try {
            const {movies, total} = await getAllMovies(req.query.limit, req.skip);
            const pagesCount = Math.ceil(total/req.query.limit);// cantidad de paginas, que es el total dividido sobre el luimite, y la propiedad math.ceil va a redondear el numero asi no queda un decimal 
            const currentPage = req.query.page; //pagina actual
            const pages = paginate.getArrayPages(req)(pagesCount,pagesCount,currentPage) //numero de paginas y cada pagina tiene su propio link (endpoint)

            return res.status(200).json({
                ok: true,
                meta: {
                    total,
                    pagesCount,
                    currentPage,
                    pages
                },
                data: movies
            });
        } catch (error) {
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                error: error.message || 'Upss, hubo un pinche error'
            })
        }
    },
    'detail': async (req, res) => {
        try {
            const movie = await getMovieByPk(req.params.id)

            return res.status(200).json({
                ok: true,
                data: movie
            })
        } catch (error) {
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                error: error.message || 'Upss, hubo un pinche error'
            })
        }
    },
    'new': (req, res) => {
        db.Movie.findAll({
            order : [
                ['release_date', 'DESC']
            ],
            limit: 5
        })
            .then(movies => {
                res.render('newestMovies', {movies});
            });
    },
    'recomended': (req, res) => {
        db.Movie.findAll({
            include: ['genre'],
            where: {
                rating: {[db.Sequelize.Op.gte] : 8}
            },
            order: [
                ['rating', 'DESC']
            ]
        })
            .then(movies => {
                res.render('recommendedMovies.ejs', {movies});
            });
    },
    //Aqui dispongo las rutas para trabajar con el CRUD
    add: function (req, res) {
        let promGenres = Genres.findAll();
        let promActors = Actors.findAll();
        
        Promise
        .all([promGenres, promActors])
        .then(([allGenres, allActors]) => {
            return res.render(path.resolve(__dirname, '..', 'views',  'moviesAdd'), {allGenres,allActors})})
        .catch(error => res.send(error))
    },
    create: async (req,res) => {
        try {

            const {title, release_date, awards, rating, length, genre_id, actors} = req.body;

            if([title, release_date, awards, rating].includes('' || undefined)){
                throw createError(400, 'totos los campos title, release_date, awards y rating son obligatorios')
            }

            const newMovie = await createMovie({
                title,
                release_date,
                awards,
                rating,
                length,
                genre_id
            }, actors);

            return res.status(200).json({
                ok: true,
                /* data: newMovie */
                msg: 'Pelicula creada',
                url: `${req.protocol}://${req.get('host')}/api/v1/movies/${newMovie.id}`
            })
            
        } catch (error) {
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                error: error.message || 'Upss, hubo un pinche error'
            })
        }
    },
    edit: async (req,res) => {

        try {
            const movieUpdate = updateMovie(req.params.id, {})

            return res.status(200).json({
                ok: true,
                /* data: newMovie */
                msg: 'Pelicula actualizada con exito',
                url: `${req.protocol}://${req.get('host')}/api/v1/movies/${newMovie.id}`
            });

        } catch (error) {
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                error: error.message || 'Upss, hubo un pinche error'
            })
        }



        /* let movieId = req.params.id;
        let promMovies = Movies.findByPk(movieId,{include: ['genre','actors']});
        let promGenres = Genres.findAll();
        let promActors = Actors.findAll();
        Promise
        .all([promMovies, promGenres, promActors])
        .then(([Movie, allGenres, allActors]) => {
            Movie.release_date = moment(Movie.release_date).format('L');
            return res.render(path.resolve(__dirname, '..', 'views',  'moviesEdit'), {Movie,allGenres,allActors})})
        .catch(error => res.send(error)) */
    },
    update: async (req,res) => {

        try {
            const movieUpdate = await updateMovie(req.params.id, req.body);
            
            return res.status(200).json({
                ok: true,
                msg: "Peliculas actualizada con exito",
                /* data: movieUpdate, */
                url: `${req.protocol}://${req.get("host")}/api/v1/movies/${movieUpdate.id}`
            });
        } catch (error) {
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                error: error.message || 'Upss, hubo un pinche error'
            })
        }

        /* let movieId = req.params.id;
        Movies
        .update(
            {
                title: req.body.title,
                rating: req.body.rating,
                awards: req.body.awards,
                release_date: req.body.release_date,
                length: req.body.length,
                genre_id: req.body.genre_id
            },
            {
                where: {id: movieId}
            })
        .then(()=> {
            return res.redirect('/movies')})            
        .catch(error => res.send(error)) */
    },
    delete: function (req,res) {
        let movieId = req.params.id;
        Movies
        .findByPk(movieId)
        .then(Movie => {
            return res.render(path.resolve(__dirname, '..', 'views',  'moviesDelete'), {Movie})})
        .catch(error => res.send(error))
    },
    destroy: async (req,res) => {

        try {
            await deleteMovie(req.params.id)
            
            return res.status(200).json({
                ok: true,
                msg: "Peliculas eliminada con exito",
            });
        } catch (error) {
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                error: error.message || 'Upss, hubo un pinche error'
            })
        }


       /*  let movieId = req.params.id;
        Movies
        .destroy({where: {id: movieId}, force: true}) // force: true es para asegurar que se ejecute la acción
        .then(()=>{
            return res.redirect('/movies')})
        .catch(error => res.send(error)) */ 
    }
}

module.exports = moviesController;