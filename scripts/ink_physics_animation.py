import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import os

# Create the figure and axis
fig, ax = plt.subplots(figsize=(8, 4))
ax.set_xlim(-20, 200)
ax.set_ylim(-20, 20)
ax.set_aspect('equal')
ax.axis('off')  # Hide axes

# Define radii for rendering
RADIUS_A = 15
RADIUS_B = 15
RADIUS_C = 15

# Point A is fixed at origin (0, 0)
point_A = plt.Circle((0, 0), RADIUS_A, color='blue', alpha=0.8, label='Point A')
ax.add_patch(point_A)

# Points B and C initialization
point_B = plt.Circle((0, 0), RADIUS_B, color='green', alpha=0.8, label='Point B')
ax.add_patch(point_B)

point_C = plt.Circle((0, 0), RADIUS_C, color='red', alpha=0.8, label='Point C')
ax.add_patch(point_C)

plt.legend(handles=[point_A, point_B, point_C], loc='upper right')
plt.title("Ink Ratio Physics Animation")

# Total frames for one full forward/backward cycle
num_frames = 200

def update(frame):
    # Calculate a parameter t that goes from 0 to 1 (forward) and 1 to 0 (backward)
    cycle = frame / num_frames
    
    # We want t to go 0 -> 1 -> 0 perfectly in 1 cycle
    if cycle < 0.5:
        # Forward phase (0 to 1)
        t = cycle * 2
    else:
        # Backward phase (1 to 0)
        t = 2 - (cycle * 2)
        
    # Introduce some "physics" easing using sine wave (ease-in-out)
    # This simulates a spring-like or damped movement
    ease_t = (1 - np.cos(t * np.pi)) / 2
    
    # Keyframes for B relative to A
    # Distances: start=0 (absorbed), 1/4=15, 2/4=40, 3/4=65, 4/4=90
    b_distances = [0, 15, 40, 65, 90]
    
    # We can interpolate B's distance based on ease_t
    # max_dist for B = 90
    b_x = ease_t * 90
    
    # Calculate opacity/absorption for B
    # When distance < 5 (close to A), it starts to become "absorbed"
    if b_x < 5:
        alpha_b = b_x / 5.0 * 0.8
    else:
        alpha_b = 0.8
        
    # Keyframes for C relative to B
    # Rel Distances: start=0 (absorbed), 1/4=-10, 2/4=15, 3/4=40, 4/4=65, 5/4=90
    # Let's map maximum relative distance of C from B to 90
    c_rel_x = ease_t * 90
    
    # However the user specified a specific physical repulsion curve 
    # C should be repelled from B: -10, 15, 40, 65, 90. 
    # Notice this is a linear progression (except the start).
    # We'll calculate C's absolute position.
    
    # When fully absorbed (t=0) C is at B (-10) -> -10
    # When t > 0, C repels from B.
    # We interpolate between -10 (rel) to +90 (rel)
    c_rel_x_mapped = -10 + ease_t * 100
    
    # For physics simulation, let's treat B and C like they repel when close.
    # C's absolute position:
    c_x = b_x + c_rel_x_mapped
    
    # Update patch positions
    point_B.center = (b_x, 0)
    point_B.set_alpha(alpha_b)
    
    point_C.center = (c_x, 0)
    
    return point_A, point_B, point_C

# Create the animation
ani = FuncAnimation(fig, update, frames=num_frames, interval=30, blit=True)

# Save as GIF
output_dir = os.path.join(os.getcwd(), 'public')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

gif_path = os.path.join(output_dir, 'ink_ratio_physics.gif')
mp4_path = os.path.join(output_dir, 'ink_ratio_physics.mp4')

print(f"Saving animation to {gif_path}...")

try:
    # Try saving as mp4 first if ffmpeg is available
    ani.save(mp4_path, writer='ffmpeg', fps=30)
    print(f"Successfully saved {mp4_path}")
except Exception as e:
    print(f"Could not save MP4 (maybe ffmpeg is missing), error: {e}")
    try:
        # Fallback to gif using Pillow
        ani.save(gif_path, writer='pillow', fps=30)
        print(f"Successfully saved {gif_path}")
    except Exception as e2:
        print(f"Could not save GIF either, error: {e2}")

plt.close()
