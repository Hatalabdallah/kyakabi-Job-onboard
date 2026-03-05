import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendEmail, getSignupEmailHtml, getSubmissionEmailHtml, getInterviewEmailHtml, getApprovalEmailHtml } from './services/email';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 5002;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });
}

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Test query successful:', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/', (req, res) => {
  res.send('Kyakabi Recruitment API is running... 🚀');
});

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const candidate = await prisma.candidate.findFirst({
      where: {
        OR: [
          { candidateId: loginId },
          { email: loginId.toLowerCase() }
        ]
      },
      include: { profile: true }
    });

    if (!candidate) {
      return res.status(401).json({ error: 'Invalid Candidate ID or email' });
    }

    if (candidate.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({
      message: 'Login successful',
      candidate: {
        id: candidate.id,
        email: candidate.email,
        role: candidate.role,
        candidateId: candidate.candidateId,
        status: candidate.status,
        submitted: candidate.submitted,
        profile: candidate.profile
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get All Candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Transform file URLs to full URLs
    const candidatesWithUrls = candidates.map(candidate => {
      if (candidate.profile) {
        if (candidate.profile.cvUrl) {
          candidate.profile.cvUrl = `${req.protocol}://${req.get('host')}${candidate.profile.cvUrl}`;
        }
        if (candidate.profile.portfolioUrl) {
          candidate.profile.portfolioUrl = `${req.protocol}://${req.get('host')}${candidate.profile.portfolioUrl}`;
        }
        if (candidate.profile.certificatesUrl && candidate.profile.certificatesUrl.length > 0) {
          candidate.profile.certificatesUrl = (candidate.profile.certificatesUrl as string[]).map(
            (url: string) => `${req.protocol}://${req.get('host')}${url}`
          );
        }
      }
      return candidate;
    });
    
    res.json(candidatesWithUrls);
  } catch (error) {
    console.error('❌ Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await prisma.candidate.findUnique({ 
      where: { email } 
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const generateId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let id = 'KG-';
      for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };

    const candidateId = generateId();

    const newCandidate = await prisma.candidate.create({
      data: {
        email,
        password,
        role,
        candidateId,
        status: 'pending',
        submitted: false,
      },
    });

    const name = email.split('@')[0];
    const emailHtml = getSignupEmailHtml(name, candidateId, role, password);
    
    sendEmail({
      to: email,
      subject: `${role} Application – Welcome to Kyakabi Group`,
      html: emailHtml,
    }).catch(err => console.error('Background email send failed:', err));

    res.status(201).json({
      message: 'Candidate created successfully',
      candidate: {
        id: newCandidate.id,
        email: newCandidate.email,
        role: newCandidate.role,
        candidateId: newCandidate.candidateId,
        status: newCandidate.status,
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Profile Setup Route with File Uploads
app.post('/api/profile/:candidateId', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), async (req: any, res) => {
  const { candidateId } = req.params;
  const profileData = JSON.parse(req.body.data || '{}');
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const requiredFields = ['firstName', 'lastName', 'phone', 'gender', 'city', 'country', 'nationality', 'currentTitle', 'yearsExperience'];
  const missingFields = requiredFields.filter(field => !profileData[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { candidateId: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Process uploaded files
    let cvUrl = null;
    let portfolioUrl = null;
    let certificatesUrl: string[] = [];

    if (files && files['cv'] && files['cv'][0]) {
      cvUrl = `/uploads/${files['cv'][0].filename}`;
    }

    if (files && files['portfolio'] && files['portfolio'][0]) {
      portfolioUrl = `/uploads/${files['portfolio'][0].filename}`;
    }

    if (files && files['certificates']) {
      certificatesUrl = files['certificates'].map(file => `/uploads/${file.filename}`);
    }

    const profileCreateData = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      whatsapp: profileData.whatsapp || null,
      gender: profileData.gender,
      dateOfBirth: profileData.dateOfBirth || null,
      city: profileData.city,
      country: profileData.country,
      nationality: profileData.nationality,
      currentTitle: profileData.currentTitle,
      yearsExperience: profileData.yearsExperience,
      skills: profileData.skills || [],
      certifications: profileData.certifications || [],
      coverLetter: profileData.coverLetter || null,
      cvUrl: cvUrl,
      portfolioUrl: portfolioUrl,
      certificatesUrl: certificatesUrl,
    };

    const updatedCandidate = await prisma.candidate.update({
      where: { candidateId: candidateId },
      data: {
        submitted: true,
        status: 'pending',
        profile: {
          upsert: {
            create: profileCreateData,
            update: profileCreateData
          }
        }
      },
      include: { profile: true }
    });

    if (updatedCandidate.profile) {
      const name = `${updatedCandidate.profile.firstName} ${updatedCandidate.profile.lastName}`;
      const submissionHtml = getSubmissionEmailHtml(name, updatedCandidate.candidateId, updatedCandidate.role);
      
      sendEmail({
        to: updatedCandidate.email,
        subject: `${updatedCandidate.role} Application – Under Review | Kyakabi Group`,
        html: submissionHtml,
      }).catch(err => console.error('Background email send failed:', err));
    }
    
  const responseCandidate = {
    ...updatedCandidate,
    profile: updatedCandidate.profile ? {
      ...updatedCandidate.profile,
      cvUrl: updatedCandidate.profile.cvUrl ? `${req.protocol}://${req.get('host')}${updatedCandidate.profile.cvUrl}` : null,
      portfolioUrl: updatedCandidate.profile.portfolioUrl ? `${req.protocol}://${req.get('host')}${updatedCandidate.profile.portfolioUrl}` : null,
      certificatesUrl: (updatedCandidate.profile as any).certificatesUrl ? 
        ((updatedCandidate.profile as any).certificatesUrl as string[]).map((url: string) => `${req.protocol}://${req.get('host')}${url}`) : [],
    } : null
  };

    res.json({
      message: 'Profile saved successfully',
      candidate: responseCandidate
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Update Candidate Status (Admin)
app.patch('/api/candidates/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, interviewDate, interviewLink, interviewNotes } = req.body;

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { profile: true }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const updateData: any = { status };
    
    if (interviewDate !== undefined) updateData.interviewDate = interviewDate;
    if (interviewLink !== undefined) updateData.interviewLink = interviewLink;
    if (interviewNotes !== undefined) updateData.interviewNotes = interviewNotes;

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
      include: { profile: true }
    });

    if (status === 'interview_scheduled' && candidate.profile && interviewDate && interviewLink) {
      const name = `${candidate.profile.firstName} ${candidate.profile.lastName}`;
      const interviewHtml = getInterviewEmailHtml(name, candidate.role, interviewDate, interviewLink);
      
      sendEmail({
        to: candidate.email,
        subject: `Interview Scheduled – ${candidate.role} | Kyakabi Group`,
        html: interviewHtml,
      }).catch(err => console.error('Background email send failed:', err));
    }

    if (status === 'approved' && candidate.profile) {
      const name = `${candidate.profile.firstName} ${candidate.profile.lastName}`;
      const approvalHtml = getApprovalEmailHtml(name, candidate.role);
      
      sendEmail({
        to: candidate.email,
        subject: `Congratulations! ${candidate.role} Offer | Kyakabi Group`,
        html: approvalHtml,
      }).catch(err => console.error('Background email send failed:', err));
    }

    res.json(updatedCandidate);
  } catch (error) {
    console.error('❌ Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete Candidate (Admin)
app.delete('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.candidate.delete({
      where: { id }
    });
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ 
      success: true,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Optional: Create admin (protected)
app.post('/api/admin/create', async (req, res) => {
  const { username, password, secretKey } = req.body;

  if (secretKey !== 'KYAKABI_ADMIN_SECRET_2026') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const existing = await prisma.admin.findUnique({
      where: { username }
    });

    if (existing) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const admin = await prisma.admin.create({
      data: {
        username,
        password,
      }
    });

    res.json({ success: true, message: 'Admin created successfully' });
  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});