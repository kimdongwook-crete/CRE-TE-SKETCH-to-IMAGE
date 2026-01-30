export const MODEL_ANALYSIS = 'gemini-3-pro-preview';
export const MODEL_IMAGE_GEN = 'gemini-3-pro-image-preview'; // Required for high quality

export const MODEL_ANALYSIS_FALLBACK = 'gemini-2.5-pro'; // Fallback for Analysis
export const MODEL_IMAGE_GEN_FALLBACK = 'gemini-2.5-flash-image'; // Fallback for Image Gen
export const MODEL_IMAGE_REFINE = 'gemini-exp-1206'; // Step 3 Primary: Experimental High-Fidelity
export const MODEL_IMAGE_REFINE_FALLBACK = 'imagen-3.0-generate-001'; // Step 3 Fallback: Stable High-Fidelity (Imagen 3)

// Timeouts (Milliseconds)
export const TIMEOUT_ANALYSIS = 60000; // 60s
export const TIMEOUT_IMAGE_GEN = 60000; // 60s
export const TIMEOUT_REFINE = 90000; // 90s (Longer for refinement)

// Camera Profiles (Lens & Constraints)
// Camera Profiles (Unified Logic: AI Lens Selection + Strict Framing)
export const CAMERA_PROFILES = {
    // 1. CONCEPT 모드
    CONCEPT: {
        lens: "AI-Selected (Match Sketch Scale/Context)", // Variable
        aperture: "AI-Selected (Match Depth)",            // Variable
        distortion: "Zero Distortion (0%)",               // FIXED
        // [5-Point Constraint System]
        constraint: "1. VIEWPOINT LOCK: Strictly maintain the exact angle. 2. FRAMING LOCK: DO NOT ZOOM. DO NOT CROP. RENDER FULL VIEW. 3. VERTICAL CORRECTION: Apply Tilt-Shift to make verticals parallel. 4. ZERO DISTORTION. 5. GEOMETRY ALIGNMENT: Match layout exactly."
    },

    // 2. DETAIL 모드 (동일 로직, 화질/텍스처 강조)
    DETAIL: {
        lens: "AI-Selected (Match Sketch Scale/Context)", // Variable
        aperture: "AI-Selected (Match Depth)",            // Variable 
        distortion: "Zero Distortion (0%)",               // FIXED
        // [5-Point Constraint System]
        constraint: "1. VIEWPOINT LOCK: Strictly maintain the exact angle. 2. FRAMING LOCK: DO NOT ZOOM. DO NOT CROP. RENDER FULL VIEW. 3. VERTICAL CORRECTION: Apply Tilt-Shift to make verticals parallel. 4. ZERO DISTORTION. 5. GEOMETRY ALIGNMENT: Match layout exactly."
    }
} as const;

export const metadata = {
    title: 'Sketch to Image',
    description: 'AI Drawing App',
};
