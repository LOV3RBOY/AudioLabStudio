import { 
  Project, 
  ReferenceTrack, 
  Stem, 
  GeneratedStem, 
  MixJob, 
  AiProcessingLog, 
  Comment, 
  Notification,
  type InsertProject,
  type InsertReferenceTrack,
  type InsertStem,
  type InsertGeneratedStem,
  type InsertMixJob,
  type InsertAiProcessingLog,
  type InsertComment,
  type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Reference Tracks
  getProjectReferenceTracks(projectId: number): Promise<ReferenceTrack[]>;
  getReferenceTrack(id: number): Promise<ReferenceTrack | undefined>;
  createReferenceTrack(track: InsertReferenceTrack): Promise<ReferenceTrack>;
  updateReferenceTrack(id: number, track: Partial<InsertReferenceTrack>): Promise<ReferenceTrack>;
  deleteReferenceTrack(id: number): Promise<void>;

  // Stems
  getProjectStems(projectId: number): Promise<Stem[]>;
  getStem(id: number): Promise<Stem | undefined>;
  createStem(stem: InsertStem): Promise<Stem>;
  updateStem(id: number, stem: Partial<InsertStem>): Promise<Stem>;
  deleteStem(id: number): Promise<void>;

  // Generated Stems
  getProjectGeneratedStems(projectId: number): Promise<GeneratedStem[]>;
  getGeneratedStem(id: number): Promise<GeneratedStem | undefined>;
  createGeneratedStem(stem: InsertGeneratedStem): Promise<GeneratedStem>;
  updateGeneratedStem(id: number, stem: Partial<InsertGeneratedStem>): Promise<GeneratedStem>;
  deleteGeneratedStem(id: number): Promise<void>;

  // Mix Jobs
  getProjectMixJobs(projectId: number): Promise<MixJob[]>;
  getMixJob(id: number): Promise<MixJob | undefined>;
  createMixJob(mixJob: InsertMixJob): Promise<MixJob>;
  updateMixJob(id: number, mixJob: Partial<InsertMixJob>): Promise<MixJob>;
  deleteMixJob(id: number): Promise<void>;

  // AI Processing Logs
  getMixJobLogs(mixJobId: number): Promise<AiProcessingLog[]>;
  createProcessingLog(log: InsertAiProcessingLog): Promise<AiProcessingLog>;

  // Comments
  getMixJobComments(mixJobId: number): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Project[] = [];
  private referenceTracks: ReferenceTrack[] = [];
  private stems: Stem[] = [];
  private generatedStems: GeneratedStem[] = [];
  private mixJobs: MixJob[] = [];
  private processingLogs: AiProcessingLog[] = [];
  private comments: Comment[] = [];
  private notifications: Notification[] = [];
  
  private nextId = 1;

  constructor() {
    this.initializeWithSampleData();
  }

  private initializeWithSampleData() {
    // Create sample projects
    const sampleProject: Project = {
      id: this.nextId++,
      name: "Summer Vibes Track",
      description: "Upbeat electronic track with tropical elements",
      genre: "Electronic",
      bpm: 128,
      keySignature: "C Major",
      settings: {
        targetLoudness: -14,
        outputFormat: "wav",
        sampleRate: 44100,
        bitDepth: 24
      },
      collaborators: [],
      tags: ["electronic", "tropical", "upbeat"],
      status: "active",
      thumbnailUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.push(sampleProject);

    // Create sample stems
    const sampleStems: Stem[] = [
      {
        id: this.nextId++,
        name: "Kick Drum",
        type: "drums",
        projectId: sampleProject.id,
        fileUrl: "/samples/kick.wav",
        waveformDataUrl: null,
        metadata: {
          duration: 120,
          sampleRate: 44100,
          bitDepth: 24,
          channels: 2,
          format: "wav",
          fileSize: 5242880
        },
        analysis: {
          peakLevel: -6.2,
          averageLevel: -18.5,
          loudness: -23.4,
          dynamicRange: 12.8,
          keyEstimate: "C",
          bpmEstimate: 128,
          spectralCentroid: 85.2,
          transients: [0.1, 0.5, 1.0, 1.5],
          harmonicContent: 0.85,
          stereoWidth: 0.2,
          fundamentalFrequency: 60,
          spectralRolloff: 150,
          zeroCrossingRate: 0.02,
          spectralFlux: 0.45,
          mfcc: [12.5, 8.3, 5.1, 2.8, 3.2, 2.1, 1.8, 1.4, 1.1, 0.9, 0.7, 0.5, 0.3],
          chromaVector: [0.8, 0.1, 0.05, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
          tempo: 128,
          typeConfidence: 0.95,
          suitability: 0.92,
          frequencySpectrum: Array.from({length: 512}, (_, i) => Math.random() * 0.8),
          noiseContent: 0.05,
          percussiveness: 0.85,
          tonality: 0.92,
          brightness: 0.45,
          roughness: 0.15,
          inharmonicity: 0.08,
          spectralComplexity: 0.72,
          spectralVariation: 0.35,
          spectralSkewness: 0.12
        },
        volume: 0.8,
        pan: 0,
        soloEnabled: false,
        muteEnabled: false,
        effects: null,
        uploadedAt: new Date()
      },
      {
        id: this.nextId++,
        name: "Bass Line",
        type: "bass",
        projectId: sampleProject.id,
        fileUrl: "/samples/bass.wav",
        waveformDataUrl: null,
        metadata: {
          duration: 120,
          sampleRate: 44100,
          bitDepth: 24,
          channels: 2,
          format: "wav",
          fileSize: 5242880
        },
        analysis: {
          peakLevel: -8.1,
          averageLevel: -20.2,
          loudness: -25.1,
          dynamicRange: 15.3,
          spectralCentroid: 120.5,
          keyEstimate: "C",
          bpmEstimate: 128,
          transients: [0.25, 0.75, 1.25, 1.75],
          harmonicContent: 0.78,
          noiseLevel: 0.03,
          stereoWidth: 0.1,
          fundamentalFrequency: 55,
          spectralRolloff: 200,
          zeroCrossingRate: 0.015,
          spectralFlux: 0.32,
          mfcc: [15.2, 11.1, 7.8, 4.2],
          chromaVector: [0.9, 0.05, 0.02, 0.01, 0.01, 0.01, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005],
          tempo: 128,
          typeConfidence: 0.88,
          suitability: 0.91
        },
        volume: 0.7,
        pan: 0,
        soloEnabled: false,
        muteEnabled: false,
        effects: null,
        uploadedAt: new Date()
      }
    ];
    this.stems.push(...sampleStems);

    // Create sample reference track
    const sampleReferenceTrack: ReferenceTrack = {
      id: this.nextId++,
      name: "Reference - Calvin Harris Style",
      projectId: sampleProject.id,
      fileUrl: "/references/calvin-harris-ref.wav",
      waveformDataUrl: null,
      metadata: {
        duration: 180,
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2,
        format: "wav",
        fileSize: 15728640
      },
      analysis: {
        peakLevel: -0.1,
        averageLevel: -12.5,
        loudness: -14.2,
        dynamicRange: 8.5,
        keyEstimate: "C Major",
        bpmEstimate: 128,
        timeSignature: "4/4",
        spectralCentroid: 1250.8,
        spectralRolloff: 5500,
        zeroCrossingRate: 0.08,
        spectralFlux: 0.72,
        mfcc: [18.5, 12.3, 8.7, 5.1, 3.2, 2.1, 1.5, 1.0, 0.8, 0.6, 0.4, 0.3, 0.2],
        chromaVector: [0.85, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.005, 0.005, 0.005, 0.005, 0.005],
        tempo: 128,
        stereoWidth: 0.85,
        detectedInstruments: [
          { instrument: "kick", confidence: 0.95 },
          { instrument: "snare", confidence: 0.88 },
          { instrument: "hihat", confidence: 0.92 },
          { instrument: "bass", confidence: 0.85 },
          { instrument: "synth", confidence: 0.78 }
        ]
      },
      uploadedAt: new Date()
    };
    this.referenceTracks.push(sampleReferenceTrack);

    // Create sample mix job
    const sampleMixJob: MixJob = {
      id: this.nextId++,
      projectId: sampleProject.id,
      prompt: "Create an upbeat summer electronic track with punchy drums and warm bass. Make it sound like Calvin Harris style with modern production.",
      status: "completed",
      progress: 100,
      version: 1,
      currentPhase: null,
      settings: {
        style: "Electronic",
        mood: "Upbeat",
        intensity: 8,
        targetLoudness: -14,
        stereoWidth: 0.8,
        dynamicRange: "medium",
        mixStyle: "modern",
        matchReference: true,
        generateMissing: false,
        professionalMaster: true
      },
      resultFileUrl: "/results/summer-vibes-mix-v1.wav",
      resultAnalysis: null,
      referenceTrackId: sampleReferenceTrack.id,
      generatedStemIds: [],
      feedback: null,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      startedAt: new Date(Date.now() - 86400000 + 1000),
      completedAt: new Date(Date.now() - 86400000 + 300000), // 5 minutes later
      estimatedCompletionTime: null
    };
    this.mixJobs.push(sampleMixJob);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.projects;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find(p => p.id === id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: this.nextId++,
      ...project,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    this.projects[index] = {
      ...this.projects[index],
      ...project,
      updatedAt: new Date()
    };
    return this.projects[index];
  }

  async deleteProject(id: number): Promise<void> {
    this.projects = this.projects.filter(p => p.id !== id);
  }

  // Reference Tracks
  async getProjectReferenceTracks(projectId: number): Promise<ReferenceTrack[]> {
    return this.referenceTracks.filter(t => t.projectId === projectId);
  }

  async getReferenceTrack(id: number): Promise<ReferenceTrack | undefined> {
    return this.referenceTracks.find(t => t.id === id);
  }

  async createReferenceTrack(track: InsertReferenceTrack): Promise<ReferenceTrack> {
    const newTrack: ReferenceTrack = {
      id: this.nextId++,
      ...track,
      uploadedAt: new Date()
    };
    this.referenceTracks.push(newTrack);
    return newTrack;
  }

  async updateReferenceTrack(id: number, track: Partial<InsertReferenceTrack>): Promise<ReferenceTrack> {
    const index = this.referenceTracks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Reference track not found');
    
    this.referenceTracks[index] = {
      ...this.referenceTracks[index],
      ...track
    };
    return this.referenceTracks[index];
  }

  async deleteReferenceTrack(id: number): Promise<void> {
    this.referenceTracks = this.referenceTracks.filter(t => t.id !== id);
  }

  // Stems
  async getProjectStems(projectId: number): Promise<Stem[]> {
    return this.stems.filter(s => s.projectId === projectId);
  }

  async getStem(id: number): Promise<Stem | undefined> {
    return this.stems.find(s => s.id === id);
  }

  async createStem(stem: InsertStem): Promise<Stem> {
    const newStem: Stem = {
      id: this.nextId++,
      ...stem,
      uploadedAt: new Date()
    };
    this.stems.push(newStem);
    return newStem;
  }

  async updateStem(id: number, stem: Partial<InsertStem>): Promise<Stem> {
    const index = this.stems.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Stem not found');
    
    this.stems[index] = {
      ...this.stems[index],
      ...stem
    };
    return this.stems[index];
  }

  async deleteStem(id: number): Promise<void> {
    this.stems = this.stems.filter(s => s.id !== id);
  }

  // Generated Stems
  async getProjectGeneratedStems(projectId: number): Promise<GeneratedStem[]> {
    return this.generatedStems.filter(s => s.projectId === projectId);
  }

  async getGeneratedStem(id: number): Promise<GeneratedStem | undefined> {
    return this.generatedStems.find(s => s.id === id);
  }

  async createGeneratedStem(stem: InsertGeneratedStem): Promise<GeneratedStem> {
    const newStem: GeneratedStem = {
      id: this.nextId++,
      ...stem,
      generatedAt: new Date()
    };
    this.generatedStems.push(newStem);
    return newStem;
  }

  async updateGeneratedStem(id: number, stem: Partial<InsertGeneratedStem>): Promise<GeneratedStem> {
    const index = this.generatedStems.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Generated stem not found');
    
    this.generatedStems[index] = {
      ...this.generatedStems[index],
      ...stem
    };
    return this.generatedStems[index];
  }

  async deleteGeneratedStem(id: number): Promise<void> {
    this.generatedStems = this.generatedStems.filter(s => s.id !== id);
  }

  // Mix Jobs
  async getProjectMixJobs(projectId: number): Promise<MixJob[]> {
    return this.mixJobs.filter(j => j.projectId === projectId);
  }

  async getMixJob(id: number): Promise<MixJob | undefined> {
    return this.mixJobs.find(j => j.id === id);
  }

  async createMixJob(mixJob: InsertMixJob): Promise<MixJob> {
    const newJob: MixJob = {
      id: this.nextId++,
      status: 'pending',
      progress: null,
      version: null,
      ...mixJob,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      completedAt: null
    };
    this.mixJobs.push(newJob);
    return newJob;
  }

  async updateMixJob(id: number, mixJob: Partial<InsertMixJob>): Promise<MixJob> {
    const index = this.mixJobs.findIndex(j => j.id === id);
    if (index === -1) throw new Error('Mix job not found');
    
    this.mixJobs[index] = {
      ...this.mixJobs[index],
      ...mixJob,
      updatedAt: new Date()
    };
    return this.mixJobs[index];
  }

  async deleteMixJob(id: number): Promise<void> {
    this.mixJobs = this.mixJobs.filter(j => j.id !== id);
  }

  // AI Processing Logs
  async getMixJobLogs(mixJobId: number): Promise<AiProcessingLog[]> {
    return this.processingLogs.filter(l => l.mixJobId === mixJobId);
  }

  async createProcessingLog(log: InsertAiProcessingLog): Promise<AiProcessingLog> {
    const newLog: AiProcessingLog = {
      id: this.nextId++,
      ...log,
      timestamp: new Date()
    };
    this.processingLogs.push(newLog);
    return newLog;
  }

  // Comments
  async getMixJobComments(mixJobId: number): Promise<Comment[]> {
    return this.comments.filter(c => c.mixJobId === mixJobId);
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.find(c => c.id === id);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      id: this.nextId++,
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.comments.push(newComment);
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment> {
    const index = this.comments.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Comment not found');
    
    this.comments[index] = {
      ...this.comments[index],
      ...comment,
      updatedAt: new Date()
    };
    return this.comments[index];
  }

  async deleteComment(id: number): Promise<void> {
    this.comments = this.comments.filter(c => c.id !== id);
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.notifications;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.find(n => n.id === id);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.nextId++,
      ...notification,
      createdAt: new Date()
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Notification not found');
    
    this.notifications[index] = {
      ...this.notifications[index],
      ...notification
    };
    return this.notifications[index];
  }

  async deleteNotification(id: number): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}

export const storage = new MemStorage();