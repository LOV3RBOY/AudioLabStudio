-- Audio Lab Studio Database Setup
-- PostgreSQL schema for production deployment

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    bpm INTEGER,
    key_signature TEXT,
    settings JSONB NOT NULL DEFAULT '{"targetLoudness": -14, "outputFormat": "wav", "sampleRate": 44100, "bitDepth": 24}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    collaborators JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'active'
);

-- Reference tracks table
CREATE TABLE IF NOT EXISTS reference_tracks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    waveform_data_url TEXT,
    metadata JSONB NOT NULL,
    analysis JSONB NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Stems table
CREATE TABLE IF NOT EXISTS stems (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    waveform_data_url TEXT,
    metadata JSONB NOT NULL,
    analysis JSONB NOT NULL,
    effects JSONB DEFAULT '[]'::jsonb,
    volume REAL DEFAULT 1.0,
    pan REAL DEFAULT 0.0,
    solo_enabled BOOLEAN DEFAULT FALSE,
    mute_enabled BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Generated stems table
CREATE TABLE IF NOT EXISTS generated_stems (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    file_url TEXT NOT NULL,
    waveform_data_url TEXT,
    metadata JSONB NOT NULL,
    analysis JSONB NOT NULL,
    effects JSONB DEFAULT '[]'::jsonb,
    volume REAL DEFAULT 1.0,
    pan REAL DEFAULT 0.0,
    solo_enabled BOOLEAN DEFAULT FALSE,
    mute_enabled BOOLEAN DEFAULT FALSE,
    generation_prompt TEXT NOT NULL,
    generation_settings JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Mix jobs table
CREATE TABLE IF NOT EXISTS mix_jobs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    reference_track_id INTEGER REFERENCES reference_tracks(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress REAL DEFAULT 0,
    current_phase TEXT,
    phase_details JSONB,
    settings JSONB NOT NULL,
    analysis_results JSONB,
    result_file_url TEXT,
    intermediate_files JSONB,
    feedback TEXT,
    version INTEGER DEFAULT 1,
    parent_job_id INTEGER,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    result_analysis JSONB,
    generated_stem_ids JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP,
    estimated_completion_time TIMESTAMP
);

-- AI Processing logs table
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id SERIAL PRIMARY KEY,
    mix_job_id INTEGER REFERENCES mix_jobs(id) ON DELETE CASCADE NOT NULL,
    phase TEXT NOT NULL,
    step TEXT NOT NULL,
    details JSONB NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    mix_job_id INTEGER REFERENCES mix_jobs(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    timestamp REAL NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_reference_tracks_project_id ON reference_tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_stems_project_id ON stems(project_id);
CREATE INDEX IF NOT EXISTS idx_stems_type ON stems(type);
CREATE INDEX IF NOT EXISTS idx_generated_stems_project_id ON generated_stems(project_id);
CREATE INDEX IF NOT EXISTS idx_mix_jobs_project_id ON mix_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_mix_jobs_status ON mix_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_mix_job_id ON ai_processing_logs(mix_job_id);
CREATE INDEX IF NOT EXISTS idx_comments_mix_job_id ON comments(mix_job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mix_jobs_updated_at BEFORE UPDATE ON mix_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO projects (name, description, genre, bpm, key_signature) VALUES
('Demo Project', 'A sample electronic music project', 'Electronic', 128, 'C Major')
ON CONFLICT DO NOTHING;
