const Handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const express = require('express')
const path = require('path')
const csurf = require('csurf') // добавление токена
const flash = require('connect-flash') // для уведомлений
const helmet = require('helmet') // для защиты запросов
const compression = require('compression') // сжатие статических файлов
const mongoose = require('mongoose')
const exphbs = require('express-handlebars') // шаблонизатор
const session = require('express-session')
const MongoStore = require('connect-mongodb-session')(session) // подключение сессий к базе данных
const keys = require('./keys/index')

const homeRoutes = require('./routes/home')
const ordersRoutes = require('./routes/orders')
const cardRoutes = require('./routes/card')
const addRoutes = require('./routes/add')
const authRoutes = require('./routes/auth')
const coursesRoutes = require('./routes/courses')
const profileRoutes = require('./routes/profile')

const varMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')
const errorMiddleware = require('./middleware/error')
const fileMiddleware = require('./middleware/file')

const MONGODB_URI = keys.MONGODB_URI
const app = express()
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
})
const store = new MongoStore({ // подключение сессий к базе данных
    collection: 'sessions',
    uri: keys.MONGODB_URI,
})

app.engine('hbs', hbs.engine) // регестрируем hbs
app.set('view engine', 'hbs') // используем hbs
app.set('views', 'views')

app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.urlencoded({ extended: true }))
app.use(session({ // подключение сессий
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
}))
app.use(fileMiddleware.single('avatar'))
app.use(csurf())
app.use(flash())
app.use(helmet())
app.use(compression())
app.use(varMiddleware)
app.use(userMiddleware)


app.use('/', homeRoutes)
app.use('/orders', ordersRoutes)
app.use('/add', addRoutes)
app.use('/auth', authRoutes)
app.use('/courses', coursesRoutes)
app.use('/card', cardRoutes)
app.use('/profile', profileRoutes)

app.use(errorMiddleware)

const PORT = process.env.PORT || 3000

const start = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {useNewUrlParser: true})

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    } catch (e) {
        console.log(e)
    }
}

start()