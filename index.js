import express from "express"
import bodyparser, { urlencoded } from "body-parser"
import pg from "pg"
import "dotenv/config";
import axios from "axios"

const app = express();
const port = 3000;


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Movies",
    password: "Zeeshan",
    port: 5432
})

db.connect();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT movies.*, likes.like_id FROM movies LEFT JOIN likes ON likes.like_id = movies.id ORDER BY movies.id")
        const movies = result.rows
        res.render("index.ejs", {
            movies: movies,
             pageTitle: "All Movies"
        })
    } catch (err) {
        console.log(err)
        res.send("Error: " + err.message)
    }
})
app.get("/new", (req, res) => {
    res.render("new.ejs");
})
app.post("/add", async (req, res) => {
    const name = req.body.MovieName;
    const movieGenre = req.body.Genre;
    const movienotes = req.body.notes
    const rating = req.body.rating
    try {
        const response = await axios.get("https://www.omdbapi.com/",{
            params: {
                apikey : process.env.OMDB_API_KEY,
                t : name,
            },
            
        });
        const poster =  response.data.Poster !== "N/A" ? response.data.Poster : null;

        await db.query("INSERT INTO movies(movie_name,genre,notes,rating,poster) VALUES ($1,$2,$3,$4,$5)", [name, movieGenre, movienotes,rating,poster])
        res.redirect("/")
    } catch (err) {
        console.log(err)
    }
});

app.post("/delete", async (req, res) => {
    try {
        const deleteid = req.body.deleteId;
        await db.query("DELETE FROM movies WHERE id = ($1)", [deleteid]);
        res.redirect("/")
    } catch (err) {
        console.log(err)
    }
})


app.get("/EditMovie", async (req, res) => {
    try {
        const editid = req.query.id;
        const result = await db.query("SELECT * FROM movies WHERE id = ($1)", [editid])
        const movie = result.rows[0];
        res.render("new.ejs", {
            movie: movie  
        })
    } catch (err) {
        console.log(err)
    }
})

app.post("/edit", async (req, res) => {
    try {
        const name = req.body.MovieName;   // form: name="MovieName"
        const genre = req.body.Genre;       // form: name="Genre"
        const notes = req.body.notes;       // form: name="notes"    
        const Rating = req.body.rating

        const response = await axios.get("https://www.omdbapi.com/",{
            params: {
                apikey : process.env.OMDB_API_KEY,
                t : name,
            },
            
        });
        const poster =  response.data.Poster !== "N/A" ? response.data.Poster : null;

        console.log(Rating)
        const id = req.body.EditId;
        await db.query("UPDATE movies SET movie_name = $1, genre = $2, notes = $3, rating = $4,poster = $5 WHERE id = $6", [name, genre, notes,Rating,poster, id])
        res.redirect("/")
    } catch (err) {
        console.log(err)
    }
})

app.get("/Search",async (req,res)=>{
try {
    const Search = req.query.searchName
    const result = await db.query("SELECT * FROM movies WHERE TRANSLATE(movie_name,'- ','') ILIKE $1",["%" + Search + "%"])
    res.render("index.ejs", {
      movies: result.rows
    });
} catch (err) {
    console.log(err)
}
})
app.post("/like", async (req, res) => {
    const likeid = req.body.likeId;
    try {
        const result = await db.query("DELETE FROM likes WHERE like_id = $1", [likeid]);
        if (result.rowCount === 0 ) {
            await db.query("INSERT INTO likes (like_id) VALUES ($1) ON CONFLICT DO NOTHING", [likeid]
);
  }

        res.redirect(req.get("Referer") || "/");
    } catch (err) {
        console.log(err);
        res.redirect("/");
    }
});

app.get("/favorites",async (req,res)=>{
try {
    const result = await db.query("SELECT * FROM movies  JOIN likes ON movies.id = like_id")
    const movies = result.rows;
    res.render("index.ejs",{
        movies:movies,
        pageTitle: "Liked Movies" 
    })

} catch (err) {
    console.log(err)
}
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
