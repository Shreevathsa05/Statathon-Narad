import React, { useRef, useMemo } from 'react';
import { Canvas, useGraph, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

export default function AvatarCanvas({ isTalking = false, audioIntensity = 0 }) {
  return (
    <div className="w-full h-full relative bg-surface">
      <Canvas camera={{ position: [0, 1.45, 1.2], fov: 40 }}>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          target={[0, 1.35, 0]}
          minPolarAngle={Math.PI / 2.5} 
          maxPolarAngle={Math.PI / 2.1} 
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        
        <Model isTalking={isTalking} audioIntensity={audioIntensity} position={[0, -0.1, 0]} />
        
        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2} far={4} />
      </Canvas>
    </div>
  );
}

function Model({ isTalking, audioIntensity, ...props }) {
  const { scene } = useGLTF('/models/free_cartoon_game_man_character_rigged.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  
  const group = useRef();
  const headRef = useRef();
  const headInitialRot = useRef(new THREE.Euler());
  const jawRef = useRef();
  const jawInitialRot = useRef(new THREE.Euler());
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  
  // Find relevant bones
  useMemo(() => {
    clone.traverse((child) => {
      if (child.isBone) {
        const name = child.name.toLowerCase();
        if (name.includes('head')) {
          headRef.current = child;
          headInitialRot.current.copy(child.rotation);
        }
        if (name.includes('jawroot')) {
          jawRef.current = child;
          jawInitialRot.current.copy(child.rotation);
        }
        
        // Eyelid bones usually named eye/lid
        if (name.includes('eyelid') || name.includes('eye_lid') || name.includes('lid')) {
          if (name.includes('l_') || name.includes('left')) leftEyeRef.current = child;
          if (name.includes('r_') || name.includes('right')) rightEyeRef.current = child;
        }
      }
    });
  }, [clone]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Procedural Breathing (Idle)
    if (group.current) {
      group.current.position.y = props.position[1] + Math.sin(t * 2) * 0.005;
    }
    
    // Procedural Talking
    if (isTalking && headRef.current) {
      // Slow, subtle head movement relative to initial
      headRef.current.rotation.x = headInitialRot.current.x + Math.sin(t * 2) * 0.03;
      headRef.current.rotation.y = headInitialRot.current.y + Math.sin(t * 1.5) * 0.04;
      headRef.current.rotation.z = headInitialRot.current.z + Math.sin(t * 1) * 0.02;
    } else if (headRef.current) {
      // Reset head
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headInitialRot.current.x, 0.05);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, headInitialRot.current.y, 0.05);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, headInitialRot.current.z, 0.05);
    }

    // Jaw sync (Mouth mimics audio intensity)
    if (jawRef.current) {
      // We stored the initial rotation to avoid squishing the model.
      // Usually opening the jaw is rotating around the Z axis.
      const targetJawRotation = isTalking ? jawInitialRot.current.z + (audioIntensity * 0.4) : jawInitialRot.current.z;
      jawRef.current.rotation.z = THREE.MathUtils.lerp(jawRef.current.rotation.z, targetJawRotation, 0.3);
    }

    // Slow Blinking
    // Blinks every ~4 seconds, lasts ~0.2 seconds
    const blinkCycle = t % 4;
    const isBlinking = blinkCycle > 3.8;
    const blinkRotation = isBlinking ? 0.3 : 0; // Adjust lid rotation

    if (leftEyeRef.current) {
      leftEyeRef.current.rotation.x = THREE.MathUtils.lerp(leftEyeRef.current.rotation.x, blinkRotation, 0.4);
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.rotation.x = THREE.MathUtils.lerp(rightEyeRef.current.rotation.x, blinkRotation, 0.4);
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <group scale={0.01}>
        <primitive object={nodes._rootJoint} />
        <skinnedMesh geometry={nodes.Object_7.geometry} material={materials.Std_Tongue} skeleton={nodes.Object_7.skeleton} />
        <skinnedMesh geometry={nodes.Object_9.geometry} material={materials.Std_Skin_Head} skeleton={nodes.Object_9.skeleton} />
        <skinnedMesh geometry={nodes.Object_10.geometry} material={materials.Std_Skin_Body} skeleton={nodes.Object_10.skeleton} />
        <skinnedMesh geometry={nodes.Object_11.geometry} material={materials.Std_Skin_Arm} skeleton={nodes.Object_11.skeleton} />
        <skinnedMesh geometry={nodes.Object_12.geometry} material={materials.Std_Skin_Leg} skeleton={nodes.Object_12.skeleton} />
        <skinnedMesh geometry={nodes.Object_13.geometry} material={materials.Std_Nails} skeleton={nodes.Object_13.skeleton} />
        <skinnedMesh geometry={nodes.Object_14.geometry} material={materials.Std_Eyelash} skeleton={nodes.Object_14.skeleton} />
        <skinnedMesh geometry={nodes.Object_16.geometry} material={materials.Std_Upper_Teeth} skeleton={nodes.Object_16.skeleton} />
        <skinnedMesh geometry={nodes.Object_17.geometry} material={materials.Std_Lower_Teeth} skeleton={nodes.Object_17.skeleton} />
        <skinnedMesh geometry={nodes.Object_19.geometry} material={materials.Std_Eye_R} skeleton={nodes.Object_19.skeleton} />
        <skinnedMesh geometry={nodes.Object_20.geometry} material={materials.Std_Cornea_R} skeleton={nodes.Object_20.skeleton} />
        <skinnedMesh geometry={nodes.Object_21.geometry} material={materials.Std_Eye_L} skeleton={nodes.Object_21.skeleton} />
        <skinnedMesh geometry={nodes.Object_22.geometry} material={materials.Std_Cornea_L} skeleton={nodes.Object_22.skeleton} />
        <skinnedMesh geometry={nodes.Object_24.geometry} material={materials.lambert3SG} skeleton={nodes.Object_24.skeleton} />
        <skinnedMesh geometry={nodes.Object_26.geometry} material={materials.lambert4} skeleton={nodes.Object_26.skeleton} />
        <skinnedMesh geometry={nodes.Object_27.geometry} material={materials.lambert5} skeleton={nodes.Object_27.skeleton} />
        <skinnedMesh geometry={nodes.Object_29.geometry} material={materials.Laces} skeleton={nodes.Object_29.skeleton} />
        <skinnedMesh geometry={nodes.Object_30.geometry} material={materials.BackShoe} skeleton={nodes.Object_30.skeleton} />
        <skinnedMesh geometry={nodes.Object_31.geometry} material={materials.FrontShoe} skeleton={nodes.Object_31.skeleton} />
        <skinnedMesh geometry={nodes.Object_32.geometry} material={materials.Sole} skeleton={nodes.Object_32.skeleton} />
        <skinnedMesh geometry={nodes.Object_34.geometry} material={materials.Classic_Taper_Scalp} skeleton={nodes.Object_34.skeleton} />
        <skinnedMesh geometry={nodes.Object_35.geometry} material={materials.Classic_Taper} skeleton={nodes.Object_35.skeleton} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/free_cartoon_game_man_character_rigged.glb');
