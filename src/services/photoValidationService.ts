interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

interface VisionAPIResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
    faceAnnotations?: Array<{
      boundingPoly: any;
      fdBoundingPoly: any;
      landmarks: any[];
      rollAngle: number;
      panAngle: number;
      tiltAngle: number;
      detectionConfidence: number;
      landmarkingConfidence: number;
      joyLikelihood: string;
      sorrowLikelihood: string;
      angerLikelihood: string;
      surpriseLikelihood: string;
      underExposedLikelihood: string;
      blurredLikelihood: string;
      headwearLikelihood: string;
    }>;
    safeSearchAnnotation?: {
      adult: string;
      spoof: string;
      medical: string;
      violence: string;
      racy: string;
    };
  }>;
}

export class PhotoValidationService {
  private static readonly API_KEY = 'AIzaSyAJ4wKKnNdE9XK7zdiaYAt9S3GwNpzFzgE';
  private static readonly API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${PhotoValidationService.API_KEY}`;

  static async validatePhoto(imageFile: File): Promise<ValidationResult> {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Prepare request payload
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'FACE_DETECTION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }
            ]
          }
        ]
      };

      // Make API request
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let details = '';
        try {
          const errJson = await response.json();
          details = errJson?.error?.message || JSON.stringify(errJson);
        } catch (_) {}
        throw new Error(`Vision API request failed: ${response.status} ${details}`);
      }

      const result: VisionAPIResponse = await response.json();
      console.debug('Vision API result:', result);
      return this.analyzeResponse(result);

    } catch (error: any) {
      console.error('Photo validation failed:', error);
      return {
        isValid: false,
        reason: error?.message || 'Failed to validate photo. Please try again.'
      };
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static analyzeResponse(response: VisionAPIResponse): ValidationResult {
    const analysis = response.responses[0];
    
    if (!analysis) {
      return {
        isValid: false,
        reason: 'Unable to analyze image. Please try again.'
      };
    }

    // Check safe search - reject inappropriate content
    if (analysis.safeSearchAnnotation) {
      const safeSearch = analysis.safeSearchAnnotation;
      if (
        safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY' ||
        safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY' ||
        safeSearch.racy === 'LIKELY' || safeSearch.racy === 'VERY_LIKELY'
      ) {
        return {
          isValid: false,
          reason: 'Please capture a baby photo with dress for try-on.'
        };
      }
    }

    // Analyze faces - should have exactly one face and be roughly front-facing
    const faces = analysis.faceAnnotations || [];
    if (faces.length !== 1) {
      return {
        isValid: false,
        reason: 'Please capture a baby photo with dress for try-on.'
      };
    }

    const face = faces[0];
    // Front-facing heuristic using angles (tolerant thresholds)
    const isFrontFacing = Math.abs(face.panAngle || 0) <= 35 && Math.abs(face.tiltAngle || 0) <= 25 && Math.abs(face.rollAngle || 0) <= 35;
    if (!isFrontFacing) {
      return {
        isValid: false,
        reason: 'Please capture a baby photo with dress for try-on.'
      };
    }

    // Analyze labels to check for baby, dress, and unwanted objects
    const labels = analysis.labelAnnotations || [];
    const labelDescriptions = labels.map(label => label.description.toLowerCase());
    
    // Check for baby/child presence
    const babyIndicators = [
      'baby', 'infant', 'child', 'toddler', 'kid', 'girl', 'person', 'human'
    ];
    const hasBabyIndicator = babyIndicators.some(indicator => 
      labelDescriptions.some(label => label.includes(indicator))
    );

    if (!hasBabyIndicator) {
      return {
        isValid: false,
        reason: 'Please capture a baby photo with dress for try-on.'
      };
    }

    // Check for dress/clothing (must include dress or generic clothing)
    const clothingIndicators = [
      'dress', 'clothing', 'apparel', 'garment', 'outfit'
    ];
    const hasClothingIndicator = clothingIndicators.some(indicator => 
      labelDescriptions.some(label => label.includes(indicator))
    );

    if (!hasClothingIndicator) {
      return {
        isValid: false,
        reason: 'Please capture a baby photo with dress for try-on.'
      };
    }

    // Check for unwanted objects/animals (background items allowed)
    const unwantedIndicators = [
      'dog', 'cat', 'pet', 'animal', 'toy', 'doll', 'adult', 'man', 'woman'
    ];
    
    const hasCriticalUnwanted = unwantedIndicators.some(unwanted => 
      labelDescriptions.some(label => label.includes(unwanted))
    );

    if (hasCriticalUnwanted) {
      return {
        isValid: false,
        reason: 'Please capture a baby photo with dress for try-on.'
      };
    }

    // All checks passed
    return {
      isValid: true
    };
  }
}