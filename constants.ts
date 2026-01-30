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
export const CAMERA_PROFILES = {
    // 1. CONCEPT 모드: 약간의 광각 + 얕은 심도로 감성적 연출
    CONCEPT: {
        lens: "35mm Standard Wide Lens",  // 적당한 넓이감
        aperture: "f/5.6",                // 배경을 살짝 부드럽게 (Depth)
        distortion: "Minimal Distortion", // 자연스러운 투시
        // [불변 제약] 시점/구도 고정
        constraint: "STRICTLY MATCH the viewpoint and framing of the sketch. DO NOT CHANGE CAMERA POSITION."
    },

    // 2. DETAIL 모드: 틸트-시프트 + 팬포커스로 정밀한 건축 기록
    DETAIL: {
        lens: "Tilt-Shift Lens",          // 수직선 교정 (Architectural Standard)
        aperture: "f/11",                 // 전체가 선명한 팬포커스 (Deep Focus)
        distortion: "Zero Distortion",    // 왜곡 없는 수직/수평 정렬
        // [불변 제약] 시점/구도 고정 + 수직선 보정
        constraint: "STRICTLY MATCH the viewpoint and framing of the sketch. CORRECT VERTICAL PERSPECTIVE convergence."
    }
} as const;

export const metadata = {
    title: 'Sketch to Image',
    description: 'AI Drawing App',
};
