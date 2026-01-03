import express from 'express'
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import errorHandler from './controllers/error.controller';
import { jioSaavnRouter } from './routes/jiosaavn.routes';

const app = express();

app.set('trust proxy', 'loopback');
app.use(cors());


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://ums-be.onrender.com/'],
    },
  })
);

const limiter = rateLimit({
  max: 900,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from your IP, please try again in an hour.',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
// app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    messgae: 'Hello from root route',
  });
});

// app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// app.use('/api/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/users', userRouter);

// JioSaavn routes
app.use('/api/jiosaavn', jioSaavnRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// 3. Global error handler
app.use(errorHandler);

export default app;

